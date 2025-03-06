let data = [];
let commits = [];
let brushSelection = null;
let selectedCommits = []; // Add this line
let xScale, yScale; // Declare global variables

let commitProgress = 100;
let timeScale;
let filteredCommits = [];

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  displayStats();
  processCommits();

  // Initialize time scale
  timeScale = d3.scaleTime([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)], [0, 100]);
  updateTimeDisplay();
  updateScatterplot(commits);
}

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/Mingrui-Zhuang/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        configurable: false,
        writable: false,
        enumerable: false,
      });

      return ret;
    });
}

function displayStats() {
  // Process commits first
  processCommits();

  // Add the title above the dl element
  d3.select('#stats').append('h2').text('Summary');

  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total commits
  dl.append('dt').text('Total Commits');
  dl.append('dd').text(commits.length);

  // Add total LOC
  dl.append('dt').html('Total LOC');
  dl.append('dd').text(data.length);

  // Add more stats as needed...
  // Number of files in the codebase
  const numFiles = d3.rollups(data, (v) => v.length, (d) => d.file).length;
  dl.append('dt').text('Number of Files');
  dl.append('dd').text(numFiles);

  // Maximum file length (in lines)
  const maxFileLength = d3.max(data, (d) => d.length);
  dl.append('dt').text('Max File Length');
  dl.append('dd').text(maxFileLength);

  // Longest line length
  const longestLineLength = d3.max(data, (d) => d.line);
  dl.append('dt').text('Longest Line Length');
  dl.append('dd').text(longestLineLength);

  // Day of the week that most work is done
  const workByDay = d3.rollups(
    data,
    (v) => v.length,
    (d) => new Date(d.datetime).toLocaleString('en', { weekday: 'long' })
  );
  const mostWorkDay = d3.max(workByDay, (d) => d[1]);
  const dayWithMostWork = workByDay.find((d) => d[1] === mostWorkDay)[0];
  dl.append('dt').text('Day with most work');
  dl.append('dd').text(dayWithMostWork);
}

function updateScatterplot(filteredCommits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 50 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  // Clear the existing SVG (circle elements)
  d3.select('svg').remove();

  // Create the SVG
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Create scales
  xScale = d3
    .scaleTime()
    .domain(d3.extent(filteredCommits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).tickFormat(
    (d) => String(d % 24).padStart(2, '0') + ':00'
  );

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Draw the scatter plot
  const dots = svg.append('g').attr('class', 'dots');

  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([6, 50]);

  // dots.selectAll('circle').remove();

  dots
    .selectAll('circle')
    .data(filteredCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7)
    .style('--r', (d) => rScale(d.totalLines))
    .on('mouseenter', function (event, d) {
      d3.select(event.currentTarget)
        .style('fill-opacity', 1)
        .classed('selected', isCommitSelected(d));
      updateTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', function () {
      d3.select(event.currentTarget)
        .style('fill-opacity', 0.7);
        // .classed('selected', isCommitSelected());
      updateTooltipContent({});
      updateTooltipVisibility(false);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    });

  // Create brush
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on('start brush end', brushed);

  svg.append('g')
    .attr('class', 'brush')
    .call(brush);

  // Raise dots and everything after overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  brushSelection = event.selection;
  selectedCommits = !brushSelection
    ? []
    : commits.filter((commit) => {
        const [[x0, y0], [x1, y1]] = brushSelection;
        const x = xScale(commit.datetime);
        const y = yScale(commit.hourFrac);
        return x >= x0 && x <= x1 && y >= y0 && y <= y1;
      });

  updateSelection();
  updateSelectionCount();
  updateLanguageBreakdown();
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const countElement = document.getElementById('selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

//Update the scatterplot with filtered commits
function updateTimeDisplay() {
  d3.select('#timeSlider').on('input', updateTimeDisplay);

  commitProgress = Number(timeSlider.value);
  let commitMaxTime = timeScale.invert(commitProgress);
  d3.select('#selectedTime').text(commitMaxTime.toLocaleString('en', {
    dateStyle: 'long',
    timeStyle: 'short',
  }));
  
  filterCommitsByTime();
  updateScatterplot(filteredCommits);
}

// Filter commits by time
function filterCommitsByTime() {
  const commitMaxTime = timeScale.invert(commitProgress);
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
}

function updateLanguageBreakdown() {
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = `
      <dt>Wow, great choice!</dt>
      <dd>␀</dd>
    `;
    return;
  }

  const lines = selectedCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }

  return breakdown;
}


function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'long',
  });
  time.textContent = commit.datetime?.toLocaleString('en', {
    timeStyle: 'short',
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 8}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// Call the loadData function to test it out
loadData();