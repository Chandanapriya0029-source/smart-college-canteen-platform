# Campus Canteen OS

### Smart College Canteen Management & Ordering Platform

Campus Canteen OS is a smart college canteen management and ordering platform designed for a college environment of approximately 200 students.

The platform focuses on reducing peak-hour congestion, providing real-time menu and inventory visibility, enabling advance ordering and scheduled pickup, simplifying payments, and helping canteen managers efficiently manage orders and demand.

## Live Demo

**Netlify:** https://spectacular-nasturtium-baf692.netlify.app/

## Key Features

### Student Experience

* View today's menu
* Check real-time food availability
* Browse and search food items
* Add items to cart
* Reserve available inventory
* Select scheduled pickup slots
* Place orders in advance
* Track order status
* Receive an order number and QR/token
* Cancel eligible orders according to refund policies

### Canteen Management

* Manage menu items and prices
* Monitor inventory
* Prevent overselling through inventory reservations
* Manage incoming orders
* Update order status
* Control pickup capacity
* Monitor peak-hour demand
* Manage cancellations and refunds

### Smart Queue Management

The platform uses pickup-slot capacity controls to distribute orders across available time windows and reduce congestion during peak hours.

### Inventory Reservation

The system temporarily reserves available food inventory during the ordering process to help prevent multiple students from purchasing the same remaining stock.

### Gemini AI

Google Gemini AI is used for demand intelligence and can assist with analyzing order patterns, pickup-slot demand, and kitchen preparation requirements.

## Technology Stack

* Frontend: React
* Backend/API: Application API layer
* Database: PostgreSQL / Supabase
* AI: Google Gemini
* Authentication: Role-based authentication
* Payment: UPI-compatible payment integration
* QR/Token: Digital order verification
* Deployment: Netlify
* Version Control: GitHub

## User Roles

### Student

Students can browse food items, check availability, place orders, schedule pickup, make payments, track orders, and verify their orders during collection.

### Canteen Manager

The canteen manager can manage menus, inventory, orders, pickup capacity, cancellations, refunds, and operational information.

## Order Lifecycle

Student selects food → Inventory reservation → Pickup slot selection → Payment → Order confirmation → Kitchen preparation → QR/token verification → Pickup → Order completion.

## Project Objective

The objective of Campus Canteen OS is to transform a traditional college canteen into a more efficient, transparent, and student-friendly digital ordering and queue-management system.

The platform is designed with a scalable architecture that can initially support a single college canteen and later expand to multiple outlets and larger student populations.

## Future Enhancements

* Demand forecasting
* Food-wastage analytics
* Student feedback and ratings
* Personalized recommendations
* Multiple canteen support
* College administration dashboard
* Push notifications
* Advanced analytics and reporting
* Automated inventory forecasting

## Project Status

**Production-oriented MVP / Active Development**

## License

This project is intended for educational and demonstration purposes.
