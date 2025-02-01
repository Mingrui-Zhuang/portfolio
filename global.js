console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// Highlight the current page's navigation link
// const navLinks = $$("nav a"); // Get all nav links
// const currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname // Find the current page link
// );
// currentLink?.classList.add('current'); // Add the 'current' class if the link exists

// Auto-generate the navigation links
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'cv/', title: 'CV' },
    { url: 'https://github.com/Mingrui-Zhuang', title: 'GitHub' }
  ];
  
const ARE_WE_HOME = document.documentElement.classList.contains('home');
  
let nav = document.createElement('nav');
document.body.prepend(nav);
  
for (let p of pages) {
    let url = p.url;
    let title = p.title;
    
    // Adjust the URL if we're not on the home page and the URL is not absolute
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;
  
    // Create the <a> element
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    // Add the 'current' class for the current page
    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
    );
    
    // Add target="_blank" for external links
    if (a.host !== location.host) {
        a.target = '_blank'; // Explicitly set the target to open in a new tab
    }

    // Append the link to the navigation
    nav.append(a);
}

// Add a theme selector
document.body.insertAdjacentHTML(
    'afterbegin',
    `
        <label class="color-scheme">
            Theme:
            <select id="theme-selector">
                <option value="light dark">Automatic</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </label>`
);

// Get the theme selector and the root element
const themeSelector = document.getElementById("theme-selector");
const root = document.documentElement;

// Function to set the theme
function setTheme(theme) {
  if (theme === "light dark") {
    // Automatic theme
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

// Load the user's preference from localStorage
const savedTheme = localStorage.getItem("colorScheme");
if (savedTheme) {
  setTheme(savedTheme);
  themeSelector.value = savedTheme; // Update the <select> element to match
} else {
  // Default to "light dark" (automatic)
  setTheme("light dark");
  themeSelector.value = "light dark";
}

// Save the user's preference to localStorage when they change the theme
themeSelector.addEventListener("change", (event) => {
  const selectedTheme = event.target.value;
  localStorage.setItem("colorScheme", selectedTheme); // Save to localStorage
  setTheme(selectedTheme);
});

// Lab 4
// Fetch JSON data for projects
export async function fetchJSON(url) {
  try {
      // Fetch the JSON file from the given URL
      const response = await fetch(url);

      // Check if the fetch request was successful
      if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      // Parse the JSON response
      const data = await response.json();
      
      // Log the data to verify its structure
      console.log(data);
      
      return data;
  } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
  }
}

// Render projects in the DOM
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Ensure the container element is valid
  if (!containerElement || !(containerElement instanceof HTMLElement)) {
      console.error("Invalid container element provided.");
      return;
  }

  // Clear existing content to avoid duplication
  containerElement.innerHTML = '';

  // Validate heading level
  const validHeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  if (!validHeadingLevels.includes(headingLevel)) {
      console.warn(`Invalid heading level "${headingLevel}", defaulting to "h2".`);
      headingLevel = 'h2';
  }

  // Loop through each project and create an article element
  projects.forEach(project => {
      const article = document.createElement('article');
      article.classList.add("project-item"); // Optional: Add a class for styling

      // Handle missing image by providing a default
      const projectImage = project.image ? project.image : '../image/default.jpg';

      article.innerHTML = `
          <${headingLevel}>${project.title}</${headingLevel}>
          <img src="${projectImage}" alt="${project.title}" width="300">
          <p>${project.description}</p>
      `;

      // Append the article to the container
      containerElement.appendChild(article);
  });
}

// Fetch GitHub user data
export async function fetchGitHubData(username) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}