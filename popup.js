document.getElementById("inject").addEventListener("click", () => {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const pageNumber = document.getElementById("pageNumber").value || 1;

  // Function to format the date as YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format the dates
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  if (!formattedStartDate || !formattedEndDate) {
    alert("Please select both start and end dates.");
    return;
  }

  chrome.runtime.sendMessage({
    action: "startScraping",
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    pageNumber: pageNumber,
  });
});
