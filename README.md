# SmartSpend - Expense Tracker Application

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) application for tracking personal expenses and managing budgets.

## Features

- **User Authentication**: Secure login and registration system
- **Expense Management**: Add, edit, delete, and view expenses
- **Budget Management**: Set monthly budgets for different categories
- **Analytics Dashboard**: Visual insights into spending patterns
- **Category-based Tracking**: Organize expenses by categories (Food, Transportation, Entertainment, etc.)
- **Real-time Updates**: Live data synchronization across all components

## Tech Stack

### Frontend
- React.js 19.1.1
- Axios for API calls
- React Router for navigation
- Tailwind CSS for styling
- Chart.js for data visualization

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Express Validator for input validation

## Project Structure

```
MERN_project/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   └── Budget.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── expenses.js
│   │   └── budgets.js
│   ├── package.json
│   └── server.js
├── frontend/
│   └── expense_tracker/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   │   ├── AddExpense.js
│       │   │   ├── AllExpenses.js
│       │   │   ├── Analytics.js
│       │   │   ├── BudgetManagement.js
│       │   │   ├── Dashboard.js
│       │   │   ├── Login.js
│       │   │   └── Register.js
│       │   ├── context/
│       │   │   └── AuthContext.js
│       │   ├── App.js
│       │   └── index.js
│       ├── package.json
│       └── tailwind.config.js
├── .gitignore
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
JWT_SECRET=your_super_secret_jwt_key_here_12345
MONGODB_URI=mongodb://localhost:27017/expense_tracker
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend/expense_tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Expenses
- `GET /api/expenses` - Get all expenses for user
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/stats` - Get expense statistics

### Budgets
- `GET /api/budgets` - Get budgets for user
- `POST /api/budgets` - Create/update budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/alerts` - Get budget alerts

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Add Expenses**: Click "Add Expense" to record new expenses with categories
3. **View Analytics**: Check the Analytics page for spending insights and trends
4. **Manage Budgets**: Set monthly budgets for different expense categories
5. **Track Spending**: Monitor your expenses and budget performance

## Features in Detail

### Expense Categories
- Food
- Transportation
- Entertainment
- Utilities
- Shopping
- Healthcare
- Education
- Travel
- Bike Repairing
- Petrol
- Rent
- Insurance
- Other

### Analytics Features
- Total spending by period (week, month, year)
- Category-wise spending breakdown
- Budget performance tracking
- Spending trends and insights

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

**Vanshit09**
- GitHub: [@vanshit09](https://github.com/vanshit09)

## Acknowledgments

- Built with React.js and Node.js
- Styled with Tailwind CSS
- Database powered by MongoDB
- Authentication using JWT