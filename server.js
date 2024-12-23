const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection
const dbURI = process.env.MONGODB_URL;
mongoose.connect(dbURI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Error connecting to MongoDB:", err));

// Student Schema and Model
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    semester: { type: String, required: true },
    courses: [
        { name: { type: String, required: true }, code: { type: String, required: true } }
    ],
    attendance: [
        {
            courseCode: { type: String, required: true },
            records: [
                { date: { type: Date, required: true }, status: { type: String, enum: ['Present', 'Absent'], required: true } }
            ]
        }
    ],
    notices: [{ type: String }]  // Array to hold notices for students
});

const Student = mongoose.model('Student', studentSchema);

// Teacher Schema and Model
const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    courses: [
        { name: { type: String, required: true }, code: { type: String, required: true }, branch: { type: String, required: true } }
    ],
    attendance: [
        { branch: { type: String, required: true }, courseCode: { type: String, required: true }, date: { type: Date, required: true } }
    ],
    notices: [{ type: String }]  // Array to hold notices for teachers
});

const Teacher = mongoose.model('Teacher', teacherSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/verify-teacher', async (req, res) => {
    const { email, branch, courseName, courseCode } = req.body;

    try {
        const teacher = await Teacher.findOne({
            email,
            "courses.branch": branch,
            "courses.name": courseName,
            "courses.code": courseCode
        });

        if (teacher) {
            // Redirect to camera-access.html page after successful verification
            res.sendFile(path.join(__dirname, 'public', 'camera-access.html'));
        } else {
            res.redirect('https://tara-user-interface.vercel.app/');  // Redirect if teacher is not verified
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error verifying teacher.");
    }
});


app.post('/mark-attendance', async (req, res) => {
    const { branch, courseCode } = req.body;

    try {
        const today = new Date();
        const students = await Student.find({ "courses.code": courseCode });

        for (const student of students) {
            let attendance = student.attendance.find(a => a.courseCode === courseCode);
            if (!attendance) {
                attendance = { courseCode, records: [] };
                student.attendance.push(attendance);
            }

            attendance.records.push({ date: today, status: "Present" });
            await student.save();
        }

        console.log(`Attendance successfully marked for ${students.length} students.`);
        res.send("Attendance successfully marked.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error marking attendance.");
    }
});

// Seed Mock Data (run only once)
app.get('/seed', async (req, res) => {
    try {
        // Seed Teacher
        await Teacher.create({
            name: "Dr. Alice Johnson",
            email: "alice.johnson@university.com",
            phone: "9876543210",
            courses: [
                { name: "Internet of Things (IoT) and Machine Learning", code: "ME102", branch: "Electronics" }
            ],
            notices: ["First notice for Dr. Alice", "Reminder: IoT workshop"]
        });

        // Seed Students
        await Student.create([{
            name: "Ayush Kumar",
            email: "kumarayush0926@gmail.com",
            phone: "9876543210",
            semester: "6",
            courses: [{ name: "Internet of Things (IoT) and Machine Learning", code: "ME102" }],
            notices: ["Holiday on 25th Dec for IoT course."]
        },
        {
            name: "Akhil",
            email: "akhil@example.com",
            phone: "9876543211",
            semester: "6",
            courses: [{ name: "Internet of Things (IoT) and Machine Learning", code: "ME102" }],
            notices: ["Semester exams starting from 10th Jan."]
        },
        {
            name: "Utkarsh",
            email: "vermautkarsh653@gmail.com",
            phone: "9876543212",
            semester: "6",
            courses: [{ name: "Internet of Things (IoT) and Machine Learning", code: "ME102" }],
            notices: ["Important: Submit project by 15th Dec."]
        },
        {
            name: "Shaad",
            email: "shaad@example.com",
            phone: "9876543213",
            semester: "6",
            courses: [{ name: "Internet of Things (IoT) and Machine Learning", code: "ME102" }],
            notices: ["Class postponed to 26th Dec."]
        }]);

        res.send("Mock data seeded successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error seeding data.");
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
