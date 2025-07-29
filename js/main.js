let csvData = [];
let headers = [];
let visibleColumns = [];
let latestUniqueRows = [];

function showTab(tab) {
    document.getElementById("main").style.display = tab === "main" ? "block" : "none";
    document.getElementById("compare").style.display = tab === "compare" ? "block" : "none";
}

function showLoader() {
    document.getElementById("loadingOverlay").style.display = "flex";
}

function hideLoader() {
    document.getElementById("loadingOverlay").style.display = "none";
}

function handleCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    showLoader();

    Papa.parse(file, {
        complete: function (results) {
            csvData = results.data.filter(row => row.some(cell => cell.trim() !== ""));
            const columnCount = csvData[0]?.length || 0;
            headers = Array.from({ length: columnCount }, (_, i) => `col${i + 1}`);
            visibleColumns = [...headers];

            renderTable();
            renderToggles();

            hideLoader();
        }
    });
}

function renderTable() {
    const html = `
    <table>
      <thead>
        <tr>${headers.map(h => visibleColumns.includes(h) ? `<th>${h}</th>` : '').join('')}</tr>
      </thead>
      <tbody>
        ${csvData.map(row => `<tr>${headers.map((h, i) => visibleColumns.includes(h) ? `<td>${row[i] || ""}</td>` : '').join('')
        }</tr>`).join('')}
      </tbody>
    </table>`;
    document.getElementById("csvTable").innerHTML = html;
}

function renderToggles() {
    document.getElementById("columnToggles").innerHTML = headers.map(h => `
    <label>
      <input type="checkbox" checked onchange="toggleColumn('${h}')"> ${h}
    </label>`).join('');
}

function toggleColumn(column) {
    showLoader(); // Show the loader

    setTimeout(() => {
        const idx = visibleColumns.indexOf(column);
        if (idx > -1) {
            visibleColumns.splice(idx, 1);
        } else {
            visibleColumns.push(column);
        }
        renderTable();
        hideLoader(); // Hide loader after table is rendered
    }, 100); // Short timeout to allow loader to display
}

function exportVisibleCSV() {
    const visibleIndexes = headers.map((h, i) => visibleColumns.includes(h) ? i : -1).filter(i => i !== -1);
    const filtered = csvData.map(row => visibleIndexes.map(i => row[i]).join(","));
    const blob = new Blob([filtered.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
}

function compareCSV() {
    const file1 = document.getElementById("csv1").files[0];
    const file2 = document.getElementById("csv2").files[0];
    if (!file1 || !file2) return alert("Please select both files.");

    showLoader();

    Promise.all([file1, file2].map(file =>
        new Promise(resolve => {
            Papa.parse(file, {
                complete: res => resolve(
                    res.data
                        .filter(row => row.some(cell => cell.trim() !== ""))
                        .map(row => row.join(","))
                )
            });
        })
    )).then(([data1, data2]) => {
        const set1 = new Set(data1);
        const set2 = new Set(data2);

        const headerRow = data1[0].split(",").map((_, i) => `col${i + 1}`);
        latestUniqueRows = [...set1].filter(row => !set2.has(row))
            .concat([...set2].filter(row => !set1.has(row)));

        const tableHtml = `
      <table>
        <thead><tr>${headerRow.map(h => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${latestUniqueRows.map(row =>
            `<tr>${row.split(",").map(c => `<td>${c}</td>`).join("")}</tr>`
        ).join("")}
        </tbody>
      </table>`;

        document.getElementById("compareResult").innerHTML = tableHtml;

        hideLoader();
    });
}

function exportCompareCSV() {
    if (!latestUniqueRows.length) return alert("No data to export. Compare first.");
    const blob = new Blob([latestUniqueRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "unique_comparison.csv";
    a.click();
}

// Animate social icons on scroll
document.addEventListener("DOMContentLoaded", () => {
    const icons = document.querySelectorAll(".social-icons a");

    icons.forEach(icon => {
        icon.style.opacity = 0;
        icon.style.transform = "translateY(10px)";
    });

    const reveal = () => {
        icons.forEach((icon, index) => {
            setTimeout(() => {
                icon.style.transition = "all 0.6s ease";
                icon.style.opacity = 1;
                icon.style.transform = "translateY(0)";
            }, index * 100);
        });
    };

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) reveal();
            });
        },
        { threshold: 0.3 }
    );

    if (icons.length > 0) {
        observer.observe(icons[0].parentElement);
    }
});

function renderToggles() {
    const container = document.getElementById("columnToggles");
    container.innerHTML = "";

    const list = document.createElement("div");
    list.className = "draggable-toggle-list";

    headers.forEach((h, index) => {
        const item = document.createElement("div");
        item.className = "toggle-item";
        item.setAttribute("draggable", "true");
        item.dataset.index = index;

        item.innerHTML = `
            <input type="checkbox" ${visibleColumns.includes(h) ? "checked" : ""} onchange="toggleColumn('${h}')">
            <span>${h}</span>
        `;

        list.appendChild(item);
    });

    container.appendChild(list);

    enableDragAndDrop(list);
}

function toggleColumn(column) {
    const idx = visibleColumns.indexOf(column);
    if (idx > -1) {
        visibleColumns.splice(idx, 1);
    } else {
        visibleColumns.push(column);
    }
    renderTable();
}

function enableDragAndDrop(container) {
    let draggedItem = null;

    container.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("toggle-item")) {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add("dragging"), 0);
        }
    });

    container.addEventListener("dragend", (e) => {
        if (draggedItem) draggedItem.classList.remove("dragging");
        draggedItem = null;
    });

    container.addEventListener("dragover", (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientX);
        if (afterElement == null) {
            container.appendChild(draggedItem);
        } else {
            container.insertBefore(draggedItem, afterElement);
        }
    });

    container.addEventListener("drop", () => {
        const newOrder = Array.from(container.children).map(child => child.querySelector("span").textContent);
        headers = newOrder;
        visibleColumns = visibleColumns.filter(col => headers.includes(col)); // ensure order sync
        renderTable();
    });
}

function getDragAfterElement(container, x) {
    const items = [...container.querySelectorAll(".toggle-item:not(.dragging)")];
    return items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
