import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from '../global.js';

let selectedIndex = -1; // Initialize selected index to -1 (no selection)
let data = []; // To store the pie chart data
let searchQuery = ''; // To store the search query
let projects = []; // To store the fetched projects

// Function to load projects from a JSON file
async function loadProjects() {
  try {
    projects = await fetchJSON('../lib/projects.json');

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

    // Render the pie chart
    renderPieChart(projects);

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

// Function to render the pie chart
function renderPieChart(projectsGiven) {
  // Clear the SVG and legend before re-rendering
  d3.select('svg').selectAll('*').remove();
  d3.select('.legend').selectAll('*').remove();

  // Group projects by year and count the number of projects per year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length, // Count the number of projects in each year
    (d) => d.year // Group by the 'year' property
  );

  // Convert the grouped data into the format required for the pie chart
  data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // Create an arc generator
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Create a pie generator
  let pieGenerator = d3.pie().value(d => d.value);

  // Generate slice data
  let arcData = pieGenerator(data);

  // Use a color scale
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Append a group element to the SVG and translate it rightward
  let svg = d3.select('#projects-plot');
  let g = svg.append('g')
    .attr('transform', 'translate(50, 50)'); // Adjust the translation values as needed

  // Generate paths for each slice and append them to the group
  arcData.forEach((d, idx) => {
    g.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(idx)) // Set the fill color using the color scale
      .attr('class', 'wedge') // Add a class to each wedge
      .on('click', function() {
        // Update the selected index and filter projects
        selectedIndex = selectedIndex === idx ? -1 : idx;
        filterAndRenderProjects();
      });
  });

  // Render the legend
  let legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend.append('div')
      .attr('class', `legend-item legend-item-${idx}`) // Add a class to each legend item
      .style('color', colors(idx))
      .text(`${d.label}: ${d.value}`)
      .on('click', () => {
        // Update the selected index and filter projects
        selectedIndex = selectedIndex === idx ? -1 : idx;
        filterAndRenderProjects();
      });
  });
}

// Function to filter and render projects based on the selected pie slice and search query
function filterAndRenderProjects() {
  let filteredProjects = projects;

  // Filter by selected year
  if (selectedIndex !== -1) {
    let selectedYear = data[selectedIndex].label;
    filteredProjects = filteredProjects.filter((project) => project.year === selectedYear);
  }

  // Filter by search query
  if (searchQuery) {
    filteredProjects = filteredProjects.filter((project) => {
      let values = Object.values(project).join(' ').toLowerCase();
      return values.includes(searchQuery.toLowerCase());
    });
  }

  // Remove highlight from all wedges and legend items if no selection
  d3.selectAll('.wedge').classed('selected', false);
  d3.selectAll('.legend-item').classed('selected', false);

  // Highlight the selected wedge and legend item if a selection is made
  if (selectedIndex !== -1) {
    d3.select(`.wedge:nth-child(${selectedIndex + 1})`).classed('selected', true);
    d3.select(`.legend-item-${selectedIndex}`).classed('selected', true);
  }

  // Render the filtered projects
  renderProjects(filteredProjects, document.querySelector('.projects'), 'h2');
}

// Call this function on page load
loadProjects();

// Add event listener for the search bar
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  // Update the search query value
  searchQuery = event.target.value.toLowerCase();

  // Filter and render projects based on the search query and selected year
  filterAndRenderProjects();
});