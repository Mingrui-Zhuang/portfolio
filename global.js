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