# E-Commerce Platform

A full-stack e-commerce application built using React, Node.js, Express.js, and MySQL. The platform supports product management, category management, reviews, authentication, cloud-based media storage, AI-powered product assistance, and event-driven order processing using AWS services.

## Features

### Authentication & Authorization
- JWT-based Authentication
- Role-Based Access Control (RBAC)
- Protected Routes
- Secure Password Handling

### Product Management
- Create, Update, Delete Products
- Product Categories
- Product Reviews and Ratings
- Product Search and Filtering
- Inventory Management

### Image Storage & File Handling
- AWS S3 Integration
- Single-Part Uploads
- Multipart Uploads for Large Files
- Upload Progress Tracking
- Upload Cancellation Support

### AI Shopping Assistant
- Google Gemini API Integration
- Product-Aware Recommendations
- Catalog-Constrained Responses
- Conversational Context Support
- Query Rate Limiting

### Order Processing
- AWS Lambda Integration
- Amazon SQS Queue Processing
- Dead Letter Queue (DLQ) Handling
- Asynchronous Order Workflows
- Failure Recovery Mechanism

### User Experience
- Responsive UI
- Dynamic Product Listings
- Category-Based Browsing
- Review Management
- Admin Dashboard

## Tech Stack

### Frontend
- React.js
- React Router
- Axios
- CSS

### Backend
- Node.js
- Express.js
- Sequelize ORM

### Database
- MySQL

### Cloud & Services
- AWS S3
- AWS Lambda
- Amazon SQS
- Amazon SQS Dead Letter Queue (DLQ)
- Google Gemini API

### Security
- JWT Authentication
- Role-Based Access Control (RBAC)
- Middleware-Based Route Protection

## Key Implementations

- RESTful API Architecture
- JWT Authentication & RBAC
- AWS S3 Multipart Upload Workflow
- MySQL Relational Database Design
- Sequelize ORM Integration
- AI-Powered Shopping Assistant using Gemini
- Conversational Context Handling
- Event-Driven Order Processing using AWS Lambda and Amazon SQS
- Dead Letter Queue (DLQ) Integration for Reliable Failure Handling
- Secure File Upload Management

## Future Improvements

- Redis Caching
- AWS CloudFront Integration
- Payment Gateway Integration
- Real-Time Notifications
- Advanced Recommendation Engine
- Analytics Dashboard
