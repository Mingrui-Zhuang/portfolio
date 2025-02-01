// Import functions from the global.js file
import { fetchJSON, renderProjects } from '../global.js';

// Function to load projects from a JSON file
async function loadProjects() {
    try {
        const projects = await fetchJSON('../lib/projects.json');

        // Select the projects container
        const projectsContainer = document.querySelector('.projects');
        const projectsTitle = document.querySelector('.projects-title');

        // Check if the container exists
        if (!projectsContainer) {
            console.error("Projects container not found in the HTML.");
            return;
        }
  
        // Check if the projects array is empty
        if (!projects || projects.length === 0) {
            console.warn("No projects found.");
            displayPlaceholderMessage();
            return;
        }
        
        // Update the projects count in the <h1>
        projectsTitle.textContent = `Projects ⌈${projects.length}⌋`;
  
        // Render the projects in the container
        renderProjects(projects, projectsContainer, 'h2');
    } catch (error) {
        console.error("Error loading projects:", error);
        displayPlaceholderMessage();
    }
  }
  
  // Function to display a placeholder message when no projects are available
  function displayPlaceholderMessage() {
    const projectsContainer = document.querySelector('.projects');
    if (projectsContainer) {
        projectsContainer.innerHTML = "<p>No projects available at the moment.</p>";
    }
  }

// Call the funtion
loadProjects();