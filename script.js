// API Configuration
let API_URL = "http://localhost:3000/students";

// DOM Elements
let studentForm = document.getElementById('studentForm');
let studentsTableBody = document.getElementById('studentsTableBody');
let submitBtn = document.getElementById('submitBtn');
let cancelBtn = document.getElementById('cancelBtn');
let refreshBtn = document.getElementById('refreshBtn');
let searchInput = document.getElementById('searchInput');
let loading = document.getElementById('loading');
let noData = document.getElementById('noData');
let messageContainer = document.getElementById('messageContainer');

// State Management
let students = [];
let editingStudent = null;
let filteredStudents = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    studentForm.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    refreshBtn.addEventListener('click', loadStudents);
    searchInput.addEventListener('input', handleSearch);
}

// CRUD Operations

// CREATE - Add new student
async function addStudent(student) {
    try {
        let response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(student)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let newStudent = await response.json();
        showMessage('Student added successfully!', 'success');
        return newStudent;
    } catch (error) {
        console.error('Error adding student:', error);
        showMessage('Error adding student: ' + error.message, 'error');
        throw error;
    }
}

// READ - Get all students
async function getAllStudents() {
    try {
        showLoading(true);
        let response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching students:', error);
        showMessage('Error fetching students: ' + error.message, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// UPDATE - Update existing student
async function updateStudent(id, student) {
    try {
        let response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(student)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let updatedStudent = await response.json();
        showMessage('Student updated successfully!', 'success');
        return updatedStudent;
    } catch (error) {
        console.error('Error updating student:', error);
        showMessage('Error updating student: ' + error.message, 'error');
        throw error;
    }
}

// DELETE - Delete student
async function deleteStudent(id) {
    try {
        let response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showMessage('Student deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting student:', error);
        showMessage('Error deleting student: ' + error.message, 'error');
        throw error;
    }
}

// UI Functions

// Load and display students
async function loadStudents() {
    try {
        students = await getAllStudents();
        filteredStudents = [...students];
        displayStudents(filteredStudents);
    } catch (error) {
        students = [];
        filteredStudents = [];
        displayStudents([]);
    }
}

// Display students in table
function displayStudents(studentsToShow) {
    if (studentsToShow.length === 0) {
        studentsTableBody.innerHTML = '';
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';
    
    studentsTableBody.innerHTML = studentsToShow.map(student => `
        <tr>
            <td>${student.id || 'N/A'}</td>
            <td>${student.name || 'N/A'}</td>
            <td>${student.age || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="editStudent('${student.id}')">
                        Edit
                    </button>
                    <button class="btn btn-danger" onclick="confirmDelete('${student.id}')">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    let formData = new FormData(studentForm);
    let student = {
        name: formData.get('name').trim(),
        age: parseInt(formData.get('age'))
    };

    // Add ID only if provided
    let id = formData.get('id').trim();
    if (id) {
        student.id = id;
    }

    // Validation
    if (!student.name) {
        showMessage('Please enter student name', 'error');
        return;
    }

    if (!student.age || student.age < 1 || student.age > 150) {
        showMessage('Please enter a valid age (1-150)', 'error');
        return;
    }

    try {
        if (editingStudent) {
            // Update existing student
            await updateStudent(editingStudent.id, student);
        } else {
            // Add new student
            await addStudent(student);
        }
        
        // Reset form and reload data
        resetForm();
        loadStudents();
    } catch (error) {
        // Error messages are handled in the CRUD functions
    }
}

// Edit student
function editStudent(id) {
    let student = students.find(s => s.id == id);
    if (!student) {
        showMessage('Student not found', 'error');
        return;
    }

    // Populate form with student data
    document.getElementById('studentId').value = student.id || '';
    document.getElementById('studentName').value = student.name || '';
    document.getElementById('studentAge').value = student.age || '';

    // Update UI for editing mode
    editingStudent = student;
    submitBtn.textContent = 'Update Student';
    submitBtn.className = 'btn btn-success';
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Cancel edit
function cancelEdit() {
    resetForm();
}

// Reset form
function resetForm() {
    studentForm.reset();
    editingStudent = null;
    submitBtn.textContent = 'Add Student';
    submitBtn.className = 'btn btn-primary';
}

// Confirm delete
function confirmDelete(id) {
    let student = students.find(s => s.id == id);
    if (!student) {
        showMessage('Student not found', 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
        handleDelete(id);
    }
}

// Handle delete
async function handleDelete(id) {
    try {
        await deleteStudent(id);
        loadStudents();
    } catch (error) {
        // Error messages are handled in the deleteStudent function
    }
}

// Search functionality
function handleSearch(e) {
    let searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredStudents = [...students];
    } else {
        filteredStudents = students.filter(student => 
            (student.name && student.name.toLowerCase().includes(searchTerm)) ||
            (student.id && student.id.toString().toLowerCase().includes(searchTerm)) ||
            (student.age && student.age.toString().includes(searchTerm))
        );
    }
    
    displayStudents(filteredStudents);
}

// Show loading state
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

// Show success/error messages
function showMessage(message, type) {
    let messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    messageContainer.appendChild(messageElement);
    
    // Auto remove message after 3 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 3000);
}

// Utility function to generate unique ID (if needed)
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}