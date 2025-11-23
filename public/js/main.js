let globalArtworkData = [];

const margin = { top: 20, right: 30, bottom: 40, left: 200 };
let width = 800 - margin.left - margin.right;
let height = 500 - margin.top - margin.bottom;

function processData(data) {
    const validData = data.filter(d => d.date_start && d.date_start > 0);
    
    const groupedData = Array.from(d3.group(validData, d => d.department_title), 
        ([department, items]) => {
            let totalYear = 0;
            let count = 0;
            items.forEach(item => {
                const year = parseInt(item.date_start);
                if (!isNaN(year) && year > 0) {
                    totalYear += year;
                    count++;
                }
            });

            const averageYear = count > 0 ? Math.round(totalYear / count) : null;
            
            return {
                department: department || 'Unknown Department',
                count: items.length,
                averageYear: averageYear
            };
        }
    ).filter(d => d.averageYear !== null);

    groupedData.sort((a, b) => a.averageYear - b.averageYear);
    
    return groupedData;
}

function drawBarChart(data) {
    d3.select("#chart-container").html('');

    const containerWidth = document.getElementById('chart-container').offsetWidth;
    width = containerWidth - margin.left - margin.right;
    
    const barHeight = 30;
    height = data.length * barHeight;

    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.averageYear), d3.max(data, d => d.averageYear)])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.department))
        .range([0, height])
        .padding(0.1);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d3.min(data, item => item.averageYear)))
        .attr("y", d => y(d.department))
        .attr("width", d => x(d.averageYear) - x(d3.min(data, item => item.averageYear)))
        .attr("height", y.bandwidth())
        .attr("fill", "#007bff");

    svg.selectAll(".label")
        .data(data)
        .enter().append("text")
        .attr("class", "label")
        .attr("x", d => x(d.averageYear) + 5)
        .attr("y", d => y(d.department) + y.bandwidth() / 2 + 5)
        .text(d => d.averageYear)
        .style("fill", "#333")
        .style("font-size", "12px");
}

function updateArtworkList(data) {
    const filterValue = d3.select("#department-filter").property("value");
    const sortValue = d3.select("#sort-order").property("value");

    let filteredData = data;

    if (filterValue !== 'All') {
        filteredData = data.filter(d => d.department_title === filterValue);
    }

    filteredData.sort((a, b) => {
        if (sortValue === 'title_asc') {
            return a.title.localeCompare(b.title);
        } else if (sortValue === 'title_desc') {
            return b.title.localeCompare(a.title);
        } else if (sortValue === 'date_asc') {
            return (a.date_start || 0) - (b.date_start || 0); 
        } else if (sortValue === 'date_desc') {
            return (b.date_start || 0) - (a.date_start || 0);
        }
    });

    const listContainer = document.getElementById('artwork-list');
    listContainer.innerHTML = '';

    filteredData.forEach(item => {
        const artworkLink = `https://www.artic.edu/artworks/${item.id}`; 
        
        const imageId = item.image_id;
        const imageUrl = imageId 
            ? `https://www.artic.edu/iiif/2/${imageId}/full/200,/0/default.jpg` 
            : 'https://placehold.co/100x100/cccccc/333333?text=No+Image';

        const listItem = document.createElement('li');
        listItem.className = 'artwork-item';
        listItem.style.listStyle = 'none';
        listItem.style.overflow = 'auto';

        let imageHtml = imageId 
            ? `<img src="${imageUrl}" alt="${item.title}" style="max-width: 100px; max-height: 100px; float: left; margin-right: 15px; border-radius: 4px;">` 
            : `<img src="${imageUrl}" alt="No Image" style="max-width: 100px; max-height: 100px; float: left; margin-right: 15px;">`;

        listItem.innerHTML = `
            ${imageHtml}
            <div class="artwork-details">
                <div class="artwork-title">
                    <strong>Title:</strong> 
                    <a href="${artworkLink}" target="_blank" style="color: blue;">${item.title}</a>
                </div>
                <div class="artwork-artist"><strong>Artist:</strong> ${item.artist_display}</div>
                <div class="artwork-meta">
                    <small>Origin: ${item.place_of_origin} | Department: ${item.department_title} | Year: ${item.date_start || 'Unknown'}</small>
                </div>
            </div>
        `;
        listContainer.appendChild(listItem);
    });
}

function populateFilter(data) {
    const departments = Array.from(new Set(data.map(d => d.department_title).filter(d => d)));
    const select = d3.select("#department-filter");
    
    select.selectAll("option:not(:first-child)").remove();

    departments.sort().forEach(dept => {
        select.append("option")
            .attr("value", dept)
            .text(dept);
    });
}

function toggleDetails() {
    const chartArea = document.getElementById('data-visualization-area');
    const button = document.getElementById('show-details-button');

    if (chartArea.style.display === 'none') {
        chartArea.style.display = 'block';
        button.textContent = 'Hide Visualization Details';
    } else {
        chartArea.style.display = 'none';
        button.textContent = 'Show Visualization Details';
    }
}


function initializeVisualization() {
    
    if (typeof artworkData === 'undefined' || artworkData.length === 0) {
        return;
    }

    globalArtworkData = artworkData;

    const processedData = processData(globalArtworkData);

    drawBarChart(processedData);

    populateFilter(globalArtworkData);
    updateArtworkList(globalArtworkData);

    d3.select("#department-filter").on("change", () => {
        updateArtworkList(globalArtworkData);
    });

    d3.select("#sort-order").on("change", () => {
        updateArtworkList(globalArtworkData);
    });

    d3.select("#show-details-button").on("click", toggleDetails);

    window.addEventListener('resize', () => {
        const resizedData = processData(globalArtworkData);
        drawBarChart(resizedData);
    });
}

document.addEventListener('DOMContentLoaded', initializeVisualization);