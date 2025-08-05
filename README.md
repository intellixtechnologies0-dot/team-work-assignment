# Team Work Assignment Web Application

A modern, responsive web application for managing and assigning work to team members. Built with vanilla HTML, CSS, and JavaScript with a beautiful, intuitive interface.

## Features

### 🎯 **Team Management**
- Add team members with name, email, and role
- View all team members in a clean card layout
- Remove team members (with automatic task reassignment)

### 📋 **Task Management**
- Create tasks with title, description, assignee, priority, and due date
- Three task statuses: To Do, In Progress, and Completed
- Priority levels: Low, Medium, High (with color coding)
- Due date tracking with smart date formatting

### 🎨 **Modern UI/UX**
- Beautiful gradient background and modern design
- Responsive layout that works on all devices
- Smooth animations and hover effects
- Drag and drop functionality for task management
- Modal dialogs for adding members and tasks

### 💾 **Data Persistence**
- All data is saved locally in the browser
- No server required - works offline
- Data persists between browser sessions

### 🔄 **Interactive Features**
- Drag and drop tasks between columns
- Click buttons to move tasks through workflow
- Real-time notifications for actions
- Form validation and error handling

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software or dependencies required

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. Start adding team members and tasks!

### File Structure
```
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## How to Use

### Adding Team Members
1. Click the "Add Member" button in the Team Members section
2. Fill in the member's name, email, and role
3. Click "Add Member" to save

### Creating Tasks
1. Click the "Create Task" button in the Tasks section
2. Fill in all required fields:
   - **Task Title**: Brief description of the task
   - **Description**: Detailed explanation
   - **Assign To**: Select from your team members
   - **Priority**: Choose Low, Medium, or High
   - **Due Date**: Set the deadline
3. Click "Create Task" to save

### Managing Tasks
- **Move Tasks**: Drag and drop tasks between columns or use the action buttons
- **Update Status**: Click "Start" to begin a task, "Complete" to finish it
- **Delete Tasks**: Click the trash icon to remove tasks
- **Priority Colors**: 
  - 🔴 Red border for High priority
  - 🟡 Yellow border for Medium priority
  - 🟢 Green border for Low priority

### Task Workflow
1. **To Do**: New tasks start here
2. **In Progress**: Tasks currently being worked on
3. **Completed**: Finished tasks

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Local Storage

The application uses browser local storage to save:
- Team member information
- Task details and status
- All data persists between browser sessions

## Customization

### Styling
You can customize the appearance by modifying `styles.css`:
- Change colors in the CSS variables
- Modify the gradient background
- Adjust spacing and layout

### Functionality
Extend the application by modifying `script.js`:
- Add new task statuses
- Implement task categories
- Add team member roles and permissions
- Integrate with external APIs

## Troubleshooting

### Data Not Saving
- Ensure cookies and local storage are enabled in your browser
- Check that you're not in incognito/private browsing mode

### Drag and Drop Not Working
- Make sure JavaScript is enabled
- Try refreshing the page
- Check browser console for errors

### Responsive Issues
- The application is designed to work on all screen sizes
- If you experience layout issues, try zooming out or using a larger screen

## Future Enhancements

Potential features for future versions:
- User authentication and accounts
- Team collaboration features
- File attachments for tasks
- Email notifications
- Task comments and discussions
- Time tracking
- Progress reports and analytics
- Export functionality (PDF, CSV)

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have suggestions for improvements, please:
1. Check the browser console for error messages
2. Ensure all files are in the same directory
3. Try using a different browser
4. Clear browser cache and local storage

---

**Enjoy managing your team's work efficiently! 🚀** 