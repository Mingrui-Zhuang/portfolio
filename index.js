import { fetchJSON, renderProjects } from './global.js';
import { fetchGitHubData } from './global.js';

async function loadLatestProjects() {
    try {
        // Fetch project data
        const projects = await fetchJSON('./lib/projects.json');

        // Get the first 3 projects
        const latestProjects = projects.slice(0, 3);

        // Select the container for the projects
        const projectsContainer = document.querySelector('.projects');

        // Ensure the container exists
        if (!projectsContainer) {
            console.error("Projects container not found.");
            return;
        }

        // Render the latest projects
        renderProjects(latestProjects, projectsContainer, 'h2');
    } catch (error) {
        console.error("Error loading latest projects:", error);
    }
}

// Call the function when the page loads
loadLatestProjects();

// Fetch GitHub data
const githubData = await fetchGitHubData('Mingrui-Zhuang');

// Select the profile container
const profileStats = document.querySelector('#profile-stats');

// Update the profile container
if (profileStats) {
    profileStats.innerHTML = `
        <h2>My GitHub Stats</h2>
        <dl>
          <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
          <dt>Followers:</dt><dd>${githubData.followers}</dd>
          <dt>Following:</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}