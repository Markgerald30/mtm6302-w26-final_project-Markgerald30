**Name:** Mark Morta **Student Number:** 041177772 **Project:** NASA Astronomy Picture of the Day

# Weather Dashboard Web App

This project is a responsive weather dashboard web application built using HTML, CSS, and Vanilla JavaScript. The goal of this project is to create an interactive app that allows users to search for a city and view real-time weather data along with forecasts and highlights.

The app uses an external weather API to fetch data asynchronously and dynamically updates the UI using DOM manipulation. It also includes features like unit conversion (Celsius/Fahrenheit), dark mode toggle, and geolocation-based weather fetching.

---

## Features

- Search for weather by city input  
- Fetch real-time weather data using API  
- Display current weather, hourly forecast, and 14-day forecast  
- Show additional highlights such as humidity, wind, UV index, and visibility  
- Toggle between Celsius and Fahrenheit  
- Dark mode toggle for accessibility  
- Auto-detect user location using geolocation  
- Nearby cities weather preview  
- Loading and error states for better user experience  

---

## Client Feedback and Improvements

Based on feedback from the client, there were a few suggested improvements to enhance the user experience.

The client wanted the color of the app to change depending on the weather condition so the interface feels more dynamic and connected to real-world conditions. This was implemented by updating the background gradients and accent colors based on the weather data.

The client also suggested adding a night mode (dark mode) for better accessibility, especially for users checking the app at night. This was implemented using a toggle feature and saved using localStorage.

These changes helped improve both usability and the overall visual experience.

---

## Challenges

One of the main challenges during development was the idea of integrating a fully interactive map where users can click on any location and automatically get weather updates based on that position.

While this feature is possible, it requires additional JavaScript libraries such as Leaflet or Google Maps API and more complex handling of latitude and longitude coordinates. Since this goes beyond the core requirements of the project, which focus on DOM manipulation, event handling, and API usage, this feature was not fully implemented.

Instead, a static embedded map was used in the interface for visual purposes.

---

## What I Learned

Through this project, I was able to practice:

- Working with APIs and asynchronous JavaScript (fetch)  
- Handling user input and form submissions  
- Updating the DOM dynamically  
- Managing application state (weather data, unit toggle, theme)  
- Implementing responsive design  
- Improving UI/UX based on feedback  

---

## Conclusion

Overall, this project helped me understand how to build a complete interactive web application from start to finish. It combines both functionality and design, while also showing how user feedback can improve the final product.