1. Introduction
The Taco Truck Locator App is a location-based mobile application designed for the USA food truck market.
Its main purpose is to help customers easily discover nearby taco trucks in real time and navigate to their live locations, while enabling taco truck vendors to share their moving locations seamlessly.
Food trucks do not operate from fixed locations and continuously change their positions, which makes it difficult for customers to find them. This application bridges that gap using real-time GPS tracking and map-based discovery.

2. Problem Statement
Taco trucks frequently change locations
Customers do not know:
Which trucks are currently nearby
The exact live location of a truck
Vendors lose potential customers due to poor visibility
Existing solutions do not focus on real-time movement tracking

3. Proposed Solution
A mobile application that:
Shows nearby taco trucks on a live map
Tracks vendor movement in real time
Allows customers to navigate directly to the truck
Enables vendors to control their online/offline availability

4. Target Users
4.1 Customers
People searching for nearby taco food trucks
Tourists and local residents
Office workers and daily commuters
4.2 Vendors (Taco Truck Owners)
Independent taco truck owners
Small food businesses
Mobile food vendors

5. Application Flow Overview
The application consists of two main user flows:
Customer Flow
Vendor (Truck Owner) Flow

6. Customer Application Flow
Step 1: App Launch & Location Access
User opens the app
App requests location permission
Current location is detected via GPS
Step 2: Nearby Taco Trucks Display
Live map view opens
Nearby online taco trucks appear as markers
Each marker shows:
Distance from the user
Open/closed status
Step 3: Truck Details View
When a user taps on a truck marker:
Truck name
Short description
Operating status
Navigation button
Step 4: Navigation
User taps “Navigate”
Google Maps / Apple Maps opens
Live route guidance to the truck’s current location

7. Vendor (Truck Owner) Application Flow
Step 1: Registration & Login
Vendor creates an account
Truck details are added during onboarding
Step 2: Go Online
Vendor taps “Go Live”
App starts sharing live GPS location automatically
Step 3: Live Location Updates
Location updates are sent to the server at regular intervals
Truck movement is reflected in real time on customer maps
Step 4: Go Offline
Vendor taps “Go Offline”
Truck is removed from customer view
