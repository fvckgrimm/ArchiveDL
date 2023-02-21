const form = document.getElementById("download-form");
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const linksInput = document.getElementById("links");
        const links = linksInput.value.split("\n").filter(link => link.trim() !== "");
        const response = await fetch("/download", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ links })
        });
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "download.zip";
          link.click();
        } else {
          alert("Error downloading files");
        }
      });