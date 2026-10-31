$(document).ready(function () {
    $(".sideBarli").removeClass("activeLi");
    $(".indexSideA").addClass("activeLi");

    async function doAjax(url, formData = {}, method = "POST") {
        return $.ajax({
            url: url,
            type: method,
            dataType: "json",
            data: formData,
            contentType: false,
            cache: false,
            processData: false,
        });
    }

    var d = new Date(),
        n = d.getMonth(),
        y = d.getFullYear();
    $("#months option:eq(" + n + ")").prop("selected", true);
    $('#years option[value="' + y + '"]').prop("selected", true);

    var month = $("#months").val();
    var year = $("#years").val();

    $("#months , #years").on("change", function (e) {
        month = $("#months").val();
        year = $("#years").val();

        initDashboardChart(month, year);
    });

    function initDashboardChart(month, year) {
        formdata = new FormData();
        formdata.append("month", month);
        formdata.append("year", year);

        var url = `${domainUrl}fetchChartData`;
        try {
            doAjax(url, formdata).then(function (response) {
                if (!response || !Array.isArray(response.data)) {
                    console.error("No response or invalid data format.");
                    return;
                }
                //   Loading Datatable
                // Format the data for chart and remove duplicates
                const userCountData = [];
                const postCountData = [];

                response.data.forEach((item) => {
                    const date = new Date(item.date);
                    const timestamp = date.getTime();
                    
                    userCountData.push({
                        x: item.date, // Ensure it's a timestamp
                        y: item.usersCount,
                    });
                    postCountData.push({
                        x: item.date, // Ensure it's a timestamp
                        y: item.postsCount,
                    });
                });

                chart.updateSeries([
                    {
                        name: "New Users",
                        data: userCountData,
                    },
                    {
                        name: "New Posts",
                        data: postCountData,
                    },
                ]);
            });
        } catch (error) {
            console.log("Error! : ", error.message);
        }
    }

    const chartElement = document.querySelector("#chart-dashboard");

    const chart = new ApexCharts(chartElement, {
        chart: {
            type: "area",
            height: 350,
        },
        stroke: {
            width: 3,
            curve: "smooth",
        },
        colors: ["#000000", "#FE1B03"],
        dataLabels: {
            enabled: false,
            // formatter: function (value) {
            //     // Return null if value is 0 to hide the label
            //     return value === 0 ? '' : `${$currency} ${value.toLocaleString()}`;
            // }
        },
        series: [
            {
                name: "New Users",
                data: [],
            },
            {
                name: "New Posts",
                data: [],
            },
        ],
        markers: {
            size: 0,
            style: "hollow",
        },
        xaxis: {
            type: "datetime",
            labels: {
                datetimeUTC: false,
                format: "dd MMM yyyy", // Format the labels as Day-Month-Year
                style: {
                    colors: "#6c757d",
                    fontSize: "12px",
                    fontFamily: "inherit",
                },
                rotate: 0, // Keep labels horizontal
                showDuplicates: false, // Ensures no duplicate labels
            },
            axisBorder: {
                show: true,
                color: "#e0e0e0",
            },
            axisTicks: {
                show: true,
                color: "#e0e0e0",
            },
            tickAmount: 10, // Dynamically adjusted based on data points
            min: undefined,
            max: undefined,
            // Set padding for labels
            labels: {
                style: {
                    colors: "#6c757d",
                    fontSize: "12px",
                    fontFamily: "inherit",
                },
                padding: 10,
            },
        },
        yaxis: {
            labels: {
                formatter: (value) => value.toLocaleString(), // Format values with commas
            },
        },
        tooltip: {
            x: {
                format: "dd MMM yyyy",
            },
            y: {
                formatter: (value) => `${value.toLocaleString()}`,
            },
        },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0,
                stops: [0, 100],
            },
        },
    });

    chart.render();

    initDashboardChart(month, year);
});
