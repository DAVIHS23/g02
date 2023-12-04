// Pfad zur CSV-Datei
const csvFilePath = './data/DAVI_data_clean.csv';

// Farben der Scala
const myColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8'];
const globalColorScale = d3.scaleOrdinal(myColors);

// Laden der CSV-Datei und dann Ausführung des angegebenen Codes
d3.csv(csvFilePath).then(data => {

  // Filter out rows with empty information before sorting and creating the table
  const filteredData = data
  //Frist Scatterplot Black and white
  createScatterplotblackandwhite("#scatterplot-first-blackandwhite", filteredData, "esg_score", "market_capitalization");

  // Erstellen des Streudiagramms mit CheckboxFen
  createScatterplotWithCheckboxes('#scatterplot', filteredData, 'esg_score', 'market_capitalization', 'industry');

  //Erstelle die MultiSetBar Chart
  createMultiSetBarChart('#barcar-e3score', filteredData)

  // Erstellen der Donut-Diagramme
  const dataForEmployees = prepareDonutData(filteredData, 'industry', 'full_time_employees');
  createDonutChart('#donut-plot-worker', dataForEmployees);

  const dataForMarketCap = prepareDonutData(filteredData, 'industry', 'market_capitalization');
  createDonutChart('#donut-plot-marketcap', dataForMarketCap);

  const combinedLegendData = combineDataForLegend(dataForEmployees, dataForMarketCap);
  createCombinedDonutChartLegend("#donut-legend", combinedLegendData, globalColorScale);

  // Ranking erstellen
  //createRanking('#esg-table', data.sort((a, b) => b.esg_score - a.esg_score), 'esg_score'); //Absteigend sortiert
  createRanking('#esg-table', filteredData.sort((a, b) => a.esg_score - b.esg_score), 'esg_score'); // Aufsteigend sortiert
  createRanking('#market_capitalization-table', filteredData.sort((a, b) => b.market_capitalization - a.market_capitalization), 'market_capitalization');
});

function createScatterplotblackandwhite(selector, data, xProp, yProp) {
  const margin = { top: 20, right: 20, bottom: 60, left: 70 },
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  // Skalen definieren
  const x = d3.scaleLinear()
    .range([0, width])
    .domain(d3.extent(data, d => +d[xProp]));
  const y = d3.scaleSqrt()
    .range([height, 0])
    .domain([0, d3.max(data, d => +d[yProp])]); // Stellen Sie sicher, dass die untere Grenze 0 ist

  // SVG-Element erstellen
  const svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  // Tooltip
  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("z-index", 10)
    .style("padding", "5px");


  // Gruppe für die Achsen und Punkte
  const plotArea = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Zoom-Funktionalität an das SVG-Element binden
  plotArea.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .call(zoom);

  // Achsen definieren
  plotArea.append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "x-axis")
    .call(d3.axisBottom(x));
  const yAxis = plotArea.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  // X-Achsenbeschriftung hinzufügen
  plotArea.append("text")
    .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
    .style("text-anchor", "middle")
    .text(xProp)
    .text(xProp.replace(/_/g, ' '));

  // Y-Achsenbeschriftung hinzufügen
  plotArea.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left + 20)
    .attr("x", 0 - (height / 2))
    .style("text-anchor", "middle")
    .text(yProp)
    .text(yProp.replace(/_/g, ' '));

  // Datenpunkte hinzufügen
  const dot = plotArea.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", d => x(d[xProp]))
    .attr("cy", d => y(d[yProp]))
    .style("fill", "black")
    .on("mouseover", function (event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html("Company: " + d.company_name + "<br/>ESG Score: " + d.esg_score + "<br/>Market Cap: " + d.market_capitalization)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0.8);
    });

  // Zoom-Funktionalität
  function zoom(svgElement) {
    svgElement.call(d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width + margin.left + margin.right, height + margin.top + margin.bottom]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed));
  }

  function zoomed(event) {
    let new_yScale = event.transform.rescaleY(y);

    // Überprüfen und Anpassen der Skala, um sicherzustellen, dass sie nicht unter 0 geht
    if (new_yScale.domain()[0] < 0) {
      new_yScale.domain([0, new_yScale.domain()[1]]);
    }

    // Y-Achse mit neuer Skala aktualisieren
    yAxis.call(d3.axisLeft(new_yScale));

    // Kreise nur entlang der Y-Achse verschieben
    dot.attr('cy', d => new_yScale(d[yProp]));
  }
}

// Funktion zur Erstellung der Rangliste in einem HTML-Element
function createRanking(selector, data, columnName) {
  // Zuerst das vorhandene Element leeren, um Duplikate zu vermeiden
  d3.select(selector).html('');

  // Erstellen der Tabelle
  const table = d3.select(selector).append('table');
  const headers = ['company_name', columnName, 'industry'];
  table.append('thead').append('tr').selectAll('th')
    .data(headers)
    .enter().append('th')
    .text(d => d.charAt(0).toUpperCase() + d.slice(1).replace('_', ' '));  // Formatierung des Headers, um ihn leserlich zu machen

  const rows = table.append('tbody').selectAll('tr')
    .data(data)
    .enter().append('tr');

  // Stellt sicher, dass die Daten korrekt den Zellen zugeordnet werden
  rows.selectAll('td')
    .data(row => [row.company_name, row[columnName], row.industry])
    .enter().append('td')
    .text(d => typeof d === 'number' ? d.toLocaleString() : d);  // Zahlen werden für eine schönere Darstellung formatiert
}

function createScatterplotWithCheckboxes(selector, data, xProp, yProp, industryProp) {
  // Erstellen des SVG-Elements für den Scatterplot
  const margin = { top: 20, right: 120, bottom: 70, left: 80 },
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  const svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Erstellen des Scatterplots
  createScatterplot(svg, data, width, height, margin, xProp, yProp, industryProp);

  // Hinzufügen der Checkboxen
  addIndustryCheckboxes(data, industryProp, svg);
}

function createScatterplot(svg, data, width, height, margin, xProp, yProp, industryProp) {
  // Erstellen einer Farbskala für verschiedene Industrien
  const color = globalColorScale
    .domain(data.map(d => d[industryProp]));

  // Skalen definieren
  const x = d3.scaleLinear()
    .range([0, width])
    .domain(d3.extent(data, d => +d[xProp]));
  const y = d3.scaleSqrt()
    .range([height, 0])
    .domain([0, d3.max(data, d => +d[yProp])]);

  // Tooltip
  var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("z-index", 10)
    .style("padding", "5px");

  // Erstellen der Achsen
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  // X-Achsenlegende
  var xAxis = svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width / 2 + margin.left)
    .attr("y", height + margin.top + 20)
    .text(xProp.replace(/_/g, ' ')); // Ersetzt Unterstriche durch Leerzeichen

  // Y-Achsenlegende
  var yAxis = svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .text(yProp.replace(/_/g, ' ')); // Ersetzt Unterstriche durch Leerzeichen

  // Zoom-Funktionalität an das SVG-Element binden
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .call(zoom);

  // Hinzufügen von Punkten
  const dot = svg.selectAll("dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(+d[xProp]))
    .attr("cy", d => y(+d[yProp]))
    .attr("r", 5)
    .style("fill", d => color(d[industryProp]))
    .on("mouseover", function (event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html("Company: " + d.company_name + "<br/>ESG Score: " + d.esg_score + "<br/>Market Cap: " + d.market_capitalization)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function (d) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0.8);
    });

  // Hinzufügen der Legende
  addLegendScatterplot(svg, data, color, width);

  // Zoom-Funktionalität
  function zoom(svgElement) {
    svgElement.call(d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width + margin.left + margin.right, height + margin.top + margin.bottom]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed));
  }

  function zoomed(event) {
    let new_yScale = event.transform.rescaleY(y);

    // Überprüfen und Anpassen der Y-Skala, um sicherzustellen, dass sie nicht unter 0 geht
    if (new_yScale.domain()[0] < 0) {
      new_yScale.domain([0, new_yScale.domain()[1]]);
    }

    //Y-Achsen mit neuen Skalen aktualisieren
    svg.select(".y-axis").call(d3.axisLeft(new_yScale));

    // Kreise an neue Skalen anpassen
    dot.attr('cy', d => new_yScale(d[yProp]));
  }
}

function addIndustryCheckboxes(data, industryProp, svg) {
  const industries = [...new Set(data.map(d => d[industryProp]))];
  const checkboxContainer = d3.select("#checkbox-container");

  industries.forEach((industry, index) => {
    const checkboxId = `checkbox-${index}`;
    const checkboxGroup = checkboxContainer.append("div")
      .attr("class", "checkbox-group");

    checkboxGroup.append("input")
      .attr("type", "checkbox")
      .attr("class", "industry-checkbox")
      .attr("id", checkboxId)
      .attr("value", industry)
      .property("checked", true);

    checkboxGroup.append("label")
      .attr("class", "checkbox-label")
      .attr("for", checkboxId)
      .text(industry);

    d3.select(`#${checkboxId}`).on("change", function () {
      const checkedIndustries = d3.selectAll('.industry-checkbox:checked').nodes()
        .map(node => node.value);
      svg.selectAll("circle")
        .style("display", d => checkedIndustries.includes(d[industryProp]) ? null : "none");
    });
  });
}

function addLegendScatterplot(svg, data, color, width) {
  const industries = [...new Set(data.map(d => d.industry))];
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + 20}, 30)`);

  industries.forEach((industry, index) => {
    legend.append("circle")
      .attr("cx", 0)
      .attr("cy", index * 20)
      .attr("r", 5)
      .style("fill", color(industry));

    legend.append("text")
      .attr("x", 10)
      .attr("y", index * 20)
      .text(industry)
      .style("font-size", "10px")
      .attr("alignment-baseline", "middle");
  });
}

function createMultiSetBarChart(selector, data) {
  // Dimensionen und Margen des Diagramms
  const margin = { top: 20, right: 20, bottom: 120, left: 70 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  // Anhängen des svg-Objekts an das angegebene DOM-Element
  const svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Berechnung der durchschnittlichen Scores mit d3.rollup
  const industryScores = Array.from(d3.rollup(data, v => ({
    environment: d3.mean(v, d => d.environment_score),
    governance: d3.mean(v, d => d.governance_score),
    social: d3.mean(v, d => d.social_score)
  }), d => d.industry)
  ).map(([industry, scores]) => ({ industry, ...scores }));

  // X-Achse
  const x = d3.scaleBand()
    .range([0, width])
    .domain(industryScores.map(d => d.industry))
    .padding(0.2);
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Y-Achse
  const y = d3.scaleLinear()
    .domain([0, d3.max(industryScores, d => Math.max(d.environment, d.governance, d.social))])
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Funktion, um die Position der Balken zu berechnen
  const barWidth = x.bandwidth() / 3;
  const calculateBarX = (d, index) => x(d.industry) + index * barWidth;

  // Balken für environment_score
  svg.selectAll(".bar.environment")
    .data(industryScores)
    .enter()
    .append("rect")
    .attr("class", "bar environment")
    .attr("x", d => calculateBarX(d, 0))
    .attr("y", d => y(d.environment))
    .attr("width", barWidth)
    .attr("height", d => height - y(d.environment))
    .attr("fill", "#1f77b4")
    .on("click", function (event, d) {
      createBoxplot("#boxplot-container", data, 'environment_score');
    });

  // Balken für governance_score
  svg.selectAll(".bar.governance")
    .data(industryScores)
    .enter()
    .append("rect")
    .attr("class", "bar governance")
    .attr("x", d => calculateBarX(d, 1))
    .attr("y", d => y(d.governance))
    .attr("width", barWidth)
    .attr("height", d => height - y(d.governance))
    .attr("fill", "#ff7f0e")
    .on("click", function (event, d) {
      createBoxplot("#boxplot-container", data, 'governance_score');
    });

  // Balken für social_score
  svg.selectAll(".bar.social")
    .data(industryScores)
    .enter()
    .append("rect")
    .attr("class", "bar social")
    .attr("x", d => calculateBarX(d, 2))
    .attr("y", d => y(d.social))
    .attr("width", barWidth)
    .attr("height", d => height - y(d.social))
    .attr("fill", "#2ca02c")
    .on("click", function (event, d) {
      createBoxplot("#boxplot-container", data, 'social_score');
    });


  // Legenden-Daten
  const legendData = [
    { label: "Environment Score", color: "#1f77b4" },
    { label: "Governance Score", color: "#ff7f0e" },
    { label: "Social Score", color: "#2ca02c" }
  ];

  // Hinzufügen der Legende
  const legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(legendData)
    .enter().append("g")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  // Rechtecke für die Legende
  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", d => d.color);

  // Text für die Legende
  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(d => d.label);

}

// Funktion zum Vorbereiten der Daten für das Donut-Diagramm
function prepareDonutData(data, industryProp, dataProp) {
  // Verwenden von d3.rollup, um die Daten zu aggregieren
  const industryCounts = d3.rollup(data,
    v => d3.sum(v, d => +d[dataProp]), // Summiere das 'dataProp' für jede Gruppe
    d => d[industryProp]); // Gruppierung nach 'industryProp'

  // Konvertieren der Map zurück in ein für d3.pie passendes Array
  const industryArray = Array.from(industryCounts, ([key, value]) => ({ key, value }));

  return industryArray;
}

function createDonutChart(selector, data) {
  const donutChartContainer = d3.select(selector).append("div")
  .attr("class", "donut-chart");

  // Größe und Marge des Diagramms festlegen
  const width = 350,
    height = 350,
    margin = 10; // Größere Marge für Beschriftungen
  const radius = Math.min(width, height) / 2 - margin;

  // SVG-Element erstellen
  const svg = donutChartContainer.append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Die Farbskala definieren
  const color = globalColorScale;

  // Daten für das Diagramm vorbereiten
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null); // um sicherzustellen, dass die Reihenfolge der Daten erhalten bleibt
  const dataReady = pie(data);

  // Der Bogen-Generator für das Donut-Diagramm
  const arc = d3.arc()
    .innerRadius(radius * 0.5) // Für den Donut-Effekt
    .outerRadius(radius);

  // Die Segmente des Donut-Diagramms erstellen
  svg.selectAll('allSlices')
    .data(dataReady)
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data.key))
    .attr('class', d => `slice ${formatClassName(d.data.key)}`)
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .on("click", (event, d) => {
      highlightIndustry(formatClassName(d.data.key));
    });

}

function formatClassName(industryName) {
  return industryName.replace(/\s+/g, '_').toLowerCase(); // Ersetzt alle Leerzeichen durch Unterstriche
}

function combineDataForLegend(dataEmployees, dataMarketCap) {
  let combinedData = new Map();

  // Hinzufügen von Employee-Daten
  dataEmployees.forEach(d => {
    combinedData.set(d.key, { industry: d.key, employees: d.value });
  });

  // Hinzufügen von MarketCap-Daten
  dataMarketCap.forEach(d => {
    if (combinedData.has(d.key)) {
      combinedData.get(d.key).marketCap = d.value;
    } else {
      combinedData.set(d.key, { industry: d.key, marketCap: d.value });
    }
  });

  return Array.from(combinedData.values());
}

function createCombinedDonutChartLegend(selector, combinedData, colorScale) {
  const legendContainer = d3.select(selector).append("div")
    .attr("class", "combined-donut-chart-legend");

  // Erstellen der Tabelle innerhalb des Containers
  const table = legendContainer.append("table");

  // Kopfzeile der Tabelle hinzufügen
  const thead = table.append("thead");
  const headerRow = thead.append("tr");
  headerRow.append("th").text(""); // Für die Farbbox
  headerRow.append("th").text("Industrie");
  headerRow.append("th").text("Vollzeit- angestellte");
  headerRow.append("th").text("Marktkapitalisierung in Mrd");

  // Körper der Tabelle hinzufügen
  const tbody = table.append("tbody");

  combinedData.forEach(d => {
    // Erstellen einer Tabellenzeile für jedes Element
    const row = tbody.append("tr")
      .attr("class", `legend-item ${formatClassName(d.industry)}`)
      .on('click', () => highlightIndustry(formatClassName(d.industry)));

    // Zelle für die Farbbox
    row.append("td")
      .append("div")
      .attr("class", `legend-item ${formatClassName(d.industry)}`)
      .style("min-width", "20px")
      .style("min-height", "20px")
      .style("background-color", colorScale(d.industry));

    // Zelle für den Namen der Industrie
    row.append("td")
      .style("min-width", "125px")
      .text(d.industry);

    // Zelle für die Anzahl der Mitarbeiter
    row.append("td")
      .text(d3.format(",")(d.employees || 0));

    // Zelle für die Marktkapitalisierung
    row.append("td")
      .text(d3.format(",")(d.marketCap || 0));
  });
}

function highlightIndustry(industryKey) {
  console.log("Clicked Industry Key:", industryKey);
  console.log(d3.selectAll('.donut-chart.slice').nodes());
  // Hervorhebung in beiden Donut-Charts
  d3.selectAll('.donut-chart .slice').style('opacity', 0.5);
  d3.selectAll(`.donut-chart .${industryKey}`).style('opacity', 1);

  // Hervorhebung in der Legende
  d3.selectAll('.combined-donut-chart-legend tr').style('font-weight', 'normal');
  d3.selectAll(`.combined-donut-chart-legend .${industryKey}`).style('font-weight', 'bold');
}

function createBoxplot(selector, data, scoreType) {

  d3.select(selector).selectAll("*").remove();
  // Definieren der Dimensionen und Margen des SVG-Canvas
  let margin = { top: 10, right: 30, bottom: 90, left: 70 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  // Anhängen des SVG-Elements an das gewünschte Div-Element
  let svg = d3.select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Gruppieren der Daten nach Industrie
  let groupedData = d3.group(data, d => d.industry);

  // Erstellen einer ordinalen Farbskala
  let colorScale = globalColorScale.domain(Array.from(groupedData.keys()));

  // Erstellen der X-Skala
  let x = d3.scaleBand()
    .range([0, width])
    .domain(Array.from(groupedData.keys()))
    .padding(0.2);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Erstellen der Y-Skala
  let y = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d[scoreType])])
    .range([height, 0])
    .nice();

  svg.append("g")
    .call(d3.axisLeft(y));

  // Funktion zum Berechnen der Quartile, Whiskers und Ausreißer
  function boxQuartilesAndWhiskers(d) {
    let sorted = d.map(g => g[scoreType]).sort(d3.ascending);
    let q1 = d3.quantile(sorted, .25);
    let median = d3.quantile(sorted, .5);
    let q3 = d3.quantile(sorted, .75);
    let iqr = q3 - q1;
    let min = Math.max(q1 - 1.5 * iqr, 0); // Verhindern, dass der Wert unter 0 fällt
    let max = q3 + 1.5 * iqr;
    let outliers = d.filter(g => g[scoreType] < min || g[scoreType] > max);
    return { q1, median, q3, min, max, outliers };
  }


  // Zeichnen der Boxplots
  groupedData.forEach((groupValues, groupName) => {
    let { q1, median, q3, min, max, outliers } = boxQuartilesAndWhiskers(groupValues);
    let boxWidth = 25;

    // Box mit Farbskala
    svg.append("rect")
      .attr("x", x(groupName) - boxWidth / 2)
      .attr("y", y(q3))
      .attr("width", boxWidth)
      .attr("height", y(q1) - y(q3))
      .attr("stroke", "black")
      .style("fill", colorScale(groupName));

    // Median
    svg.append("line")
      .attr("x1", x(groupName) - boxWidth / 2)
      .attr("x2", x(groupName) + boxWidth / 2)
      .attr("y1", y(median))
      .attr("y2", y(median))
      .attr("stroke", "black");

    /*
  // Unterer Whisker
  svg.append("line")
    .attr("x1", x(groupName))
    .attr("x2", x(groupName))
    .attr("y1", y(min))
    .attr("y2", y(q1))
    .attr("stroke", "black");
 
  // Oberer Whisker
  svg.append("line")
    .attr("x1", x(groupName))
    .attr("x2", x(groupName))
    .attr("y1", y(max))
    .attr("y2", y(q3))
    .attr("stroke", "black");
*/

    // Ausreißer
    outliers.forEach(d => {
      svg.append("circle")
        .attr("cx", x(groupName))
        .attr("cy", y(d[scoreType]))
        .attr("r", 3)
        .style("fill", "black");
    });

    // Titel zur Y-Achse
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left + 20)
      .attr("x", 0 - (height / 2))
      .attr("dy", "0.8em")
      .style("text-anchor", "middle")
      .text(scoreType.replace('_', ' ').toUpperCase());
  });
}

function openLightbox(lightboxId) {
  document.getElementById(lightboxId).style.display = 'flex';
}

function closeLightbox(lightboxId) {
  document.getElementById(lightboxId).style.display = 'none';
}
