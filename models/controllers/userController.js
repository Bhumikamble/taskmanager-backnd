// controllers/userController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
// const Task = require('../models/taskModel');


// User Registration
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

// User Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

// Get User Info
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user data', error: error.message });
    }
};


// controllers/taskController.js
const Task = require('../models/taskModel');

// Create Task
exports.createTask = async (req, res) => {
    const { title, description, status } = req.body;

    try {
        const newTask = new Task({
            title,
            description,
            status,
            user: req.user.id,
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: 'Error creating task', error: error.message });
    }
};

// Get Tasks
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks', error: error.message });
    }
};

// Update Task
exports.updateTask = async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.user.toString() !== req.user.id)
            return res.status(401).json({ message: 'Unauthorized' });

        task.title = title || task.title;
        task.description = description || task.description;
        task.status = status || task.status;

        await task.save();
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task', error: error.message });
    }
};

// Delete Task
exports.deleteTask = async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findById(id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.user.toString() !== req.user.id)
            return res.status(401).json({ message: 'Unauthorized' });

        await task.remove();
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting task', error: error.message });
    }
};
