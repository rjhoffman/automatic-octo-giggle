// Constructor for backlog items
function BacklogItem(name, description, priority, size, maxTracks) {
    this.name = name;
    this.description = description;
    this.priority = priority;
    this.size = size;
    this.maxTracks = maxTracks;
}

let teamSize = 0;
let backlogItems = [];
let startDate = null;

// Load backlog items from local storage if available
window.onload = function() {
    const savedBacklog = JSON.parse(localStorage.getItem('backlogItems'));
    if (savedBacklog) {
        backlogItems = savedBacklog.map(item => new BacklogItem(item.name, item.description, item.priority, item.size, item.maxTracks));
        savedBacklog.forEach(item => addBacklogItem(item));
    }
};

document.getElementById('teamForm').addEventListener('submit', function(event){
    event.preventDefault();
    teamSize = document.getElementById('teamSize').value;
    document.getElementById('backlogForm').style.display = 'block';
});

function addBacklogItem(itemData) {
    const backlogDiv = document.getElementById('backlogItems');
    const newBacklogItem = document.createElement('div');
    newBacklogItem.classList.add('backlog-item');
    newBacklogItem.innerHTML = `
        <label>Item Name:</label>
        <input type="text" name="itemName" placeholder="Item Name" required>
        <label>Description:</label>
        <textarea name="itemDescription" placeholder="Description" required></textarea>
        <label>Priority:</label>
        <input type="number" name="itemPriority" placeholder="Priority" min="1" required>
        <label>Total Size (in dev weeks):</label>
        <input type="number" name="itemSize" placeholder="Total Size" min="1" required>
        <label>Max Parallel Tracks:</label>
        <input type="number" name="itemTracks" placeholder="Max Parallel Tracks" min="1" required>
    `;
    backlogDiv.appendChild(newBacklogItem);

    if (itemData) {
        newBacklogItem.querySelector('input[name="itemName"]').value = itemData.name;
        newBacklogItem.querySelector('textarea[name="itemDescription"]').value = itemData.description;
        newBacklogItem.querySelector('input[name="itemPriority"]').value = itemData.priority;
        newBacklogItem.querySelector('input[name="itemSize"]').value = itemData.size;
        newBacklogItem.querySelector('input[name="itemTracks"]').value = itemData.maxTracks;
    }
}

document.getElementById('backlogForm').addEventListener('submit', function(event){
    event.preventDefault();
    const itemElements = document.getElementById('backlogItems').children;
    backlogItems = [];

    for (let item of itemElements) {
        const name = item.querySelector('input[name="itemName"]').value;
        const description = item.querySelector('textarea[name="itemDescription"]').value;
        const priority = parseInt(item.querySelector('input[name="itemPriority"]').value);
        const size = parseInt(item.querySelector('input[name="itemSize"]').value);
        const maxTracks = parseInt(item.querySelector('input[name="itemTracks"]').value);
        
        backlogItems.push(new BacklogItem(name, description, priority, size, maxTracks));
    }

    localStorage.setItem('backlogItems', JSON.stringify(backlogItems));
    document.getElementById('startDateForm').style.display = 'block';
});

document.getElementById('startDateForm').addEventListener('submit', function(event){
    event.preventDefault();
    startDate = new Date(document.getElementById('startDate').value);
    generateRoadmap();
});

function generateRoadmap() {
    console.log('Generating roadmap with team size:', teamSize);
    console.log('Backlog items:', backlogItems);

    // Sort the backlog items by priority
    backlogItems.sort((a, b) => a.priority - b.priority);

    // Initialize variables for roadmap generation
    let workLeft = backlogItems.map(item => ({ ...item, currentAllocated: 0 }));
    let roadmap = [];
    let isWorkRemaining = () => workLeft.some(item => item.size > 0);

    // Iterate over weeks as long as there is work remaining
    for (let week = 0; isWorkRemaining(); week++) {
        let weekAllocation = new Map();
        roadmap[week] = new Array(teamSize).fill('EMPTY');

        for (let i = 0; i < teamSize; i++) {
            for (let item of workLeft) {
                let allocated = weekAllocation.get(item.name) || 0;

                if (item.size > 0 && allocated < item.maxTracks) {
                    roadmap[week][i] = item.name;
                    item.size--;
                    weekAllocation.set(item.name, allocated + 1);
                    break;
                }
            }
        }

        console.log(`Week ${week + 1} allocation:`, roadmap[week]);
    }

    console.log('Generated roadmap:', roadmap);
    displayRoadmap(roadmap);
}


function displayRoadmap(roadmap) {
    let colorMap = new Map();
    let colors = ['#b3e5fc', '#ffccbc', '#c8e6c9', '#f8bbd0', '#b2dfdb']; // Muted color palette
    let nextColor = 0;

    let table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.textAlign = 'center';

    let thead = table.createTHead();
    let headerRow = thead.insertRow();
    let firstHeaderCell = document.createElement('th');
    firstHeaderCell.innerText = 'Engineer / Week';
    firstHeaderCell.style.border = '1px solid black';
    headerRow.appendChild(firstHeaderCell);

    // Creating headers with actual dates based on the start date
    for (let i = 0; i < roadmap[0].length; i++) {
        let headerCell = document.createElement('th');
        let weekDate = new Date(startDate);
        weekDate.setDate(startDate.getDate() + i * 7);
        headerCell.innerText = `Week ${i + 1} (${weekDate.toLocaleDateString()})`;
        headerCell.style.border = '1px solid black';
        headerRow.appendChild(headerCell);
    }

    // Creating table rows for each engineer
    for (let i = 0; i < teamSize; i++) {
        let row = table.insertRow();
        
        let nameCell = row.insertCell();
        nameCell.innerText = `Engineer ${i + 1}`;
        nameCell.style.fontWeight = 'bold';
        nameCell.style.border = '1px solid black';

        for (let j = 0; j < roadmap[0].length; j++) {
            let cell = row.insertCell();
            let project = roadmap[j][i];
            cell.innerText = project !== 'EMPTY' ? project : '';
            cell.style.border = '1px solid black';

            // Assigning colors to projects
            if (project !== 'EMPTY' && !colorMap.has(project)) {
                colorMap.set(project, colors[nextColor++ % colors.length]);
            }
            cell.style.backgroundColor = colorMap.get(project) || 'white';
        }
    }

    let roadmapDisplay = document.getElementById('roadmapDisplay');
    roadmapDisplay.innerHTML = '';
    roadmapDisplay.appendChild(table);
}

