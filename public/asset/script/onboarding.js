$(document).ready(function () {
    $(".sideBarli").removeClass("activeLi");
    $(".onboardingSideA").addClass("activeLi");

    $(".onboardingModalBtn").on("click", function (event) {
        event.preventDefault();
        $("#addForm")[0].reset();
    });

    $("#onboardingTable").dataTable({
        processing: true,
        serverSide: true,
        serverMethod: "post",
        aaSorting: [[0, "desc"]],
        columnDefs: [
            {
                targets: [0, 1, 2, 3],
                orderable: false,
            },
        ],
        ajax: {
            url: `${domainUrl}onboardingList`,
            data: function (data) {},
        },
    });

    $("#addOnboarding").on("submit", function (event) {
        event.preventDefault();
        if (user_type == 1) {
            var formdata = new FormData($("#addOnboarding")[0]);
            console.log(formdata);
            $.ajax({
                url: `${domainUrl}addOnboarding`,
                type: "POST",
                data: formdata,
                dataType: "json",
                contentType: false,
                cache: false,
                processData: false,
                success: function (response) {
                    if (response.status == false) {
                        console.log(response.message);
                    } else if (response.status == true) {
                        iziToast.show({
                            title: app.Success,
                            message: app.onboardingAdd,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
                        $("#onboardingTable")
                            .DataTable()
                            .ajax.reload(null, false);
                        $("#addOnboardingModal").modal("hide");
                        $("#addOnboarding")[0].reset();
                    }
                },
            });
        } else {
            iziToast.show({
                title: `${app.Error}!`,
                message: app.tester,
                color: app.redToast,
                position: app.toastPosition,
                transitionIn: app.transitionInAction,
                transitionOut: app.transitionOutAction,
                timeout: app.timeout,
                animateInside: false,
                iconUrl: app.cancleIcon,
            });
        }
    });

    $("#onboardingTable").on("click", ".edit", function (e) {
        e.preventDefault();
        var id = $(this).attr("rel");
        var title = $(this).data("title");
        var description = $(this).data("description");

        $("#editOnboardingId").val(id);
        $("#edit_title").val(title);
        $("#edit_description").val(description);
        $("#editOnboardingModal").modal("show");
    });

    $(document).on("submit", "#editOnboardingForm", function (e) {
        e.preventDefault();
        var id = $("#editOnboardingId").val();
        if (user_type == 1) {
            let EditformData = new FormData($("#editOnboardingForm")[0]);
            EditformData.append("onboarding_id", id);
            $.ajax({
                type: "POST",
                url: `${domainUrl}updateOnboardingScreen`,
                data: EditformData,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.status == false) {
                        console.log(response.message);
                    } else if (response.status == true) {
                        iziToast.show({
                            title: app.Success,
                            message: app.onboardingUpdated,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
                        $("#onboardingTable")
                            .DataTable()
                            .ajax.reload(null, false);
                        $("#editOnboardingModal").modal("hide");
                    }
                },
            });
        } else {
            iziToast.show({
                title: `${app.Error}!`,
                message: app.tester,
                color: app.redToast,
                position: app.toastPosition,
                transitionIn: app.transitionInAction,
                transitionOut: app.transitionOutAction,
                timeout: app.timeout,
                animateInside: false,
                iconUrl: app.cancleIcon,
            });
        }
    });

    $("#onboardingTable").on("click", ".delete", function (e) {
        e.preventDefault();
        var id = $(this).attr("rel");
        console.log(id);
        if (user_type == 1) {
            swal({
                title: "Are you sure?",
                icon: "error",
                buttons: true,
                dangerMode: true,
                buttons: ["Cancel", "Yes"],
            }).then((deleteValue) => {
                if (deleteValue) {
                    if (deleteValue == true) {
                        $.ajax({
                            type: "POST",
                            url: `${domainUrl}deleteOnboardingScreen`,
                            dataType: "json",
                            data: {
                                onboarding_id: id,
                            },
                            success: function (response) {
                                if (response.status == false) {
                                    console.log(response.message);
                                } else if (response.status == true) {
                                    iziToast.show({
                                        title: app.Success,
                                        message: app.onboardingDeleted,
                                        color: app.greenToast,
                                        position: app.toastPosition,
                                        transitionIn: app.fadeInAction,
                                        transitionOut: app.fadeOutAction,
                                        timeout: app.timeout,
                                        animateInside: false,
                                        iconUrl: app.checkCircleIcon,
                                    });
                                    $("#onboardingTable")
                                        .DataTable()
                                        .ajax.reload(null, false);
                                }
                            },
                        });
                    }
                }
            });
        } else {
            iziToast.show({
                title: `${app.Error}!`,
                message: app.tester,
                color: app.redToast,
                position: app.toastPosition,
                transitionIn: app.transitionInAction,
                transitionOut: app.transitionOutAction,
                timeout: app.timeout,
                animateInside: false,
                iconUrl: app.cancleIcon,
            });
        }
    });

    $("#onboardingTable tbody").sortable({
        handle: ".sort-handler",
        update: function () {
            sendOnBoardingOrderToServer();
        },
    });

    function sendOnBoardingOrderToServer() {
        var order = [];
        $("div.sort-handler").each(function (index, element) {
            order.push({
                id: $(this).attr("data-id"),
                position: index + 1,
            });
        });

        $.ajax({
            type: "POST",
            dataType: "json",
            url: `${domainUrl}updateOnboardingOrder`,
            data: {
                order: order,
            },
            success: function (response) {
                if (response.status) {
                    iziToast.show({
                        title: app.Success,
                        message: app.onboardingUpdated,
                        color: app.greenToast,
                        position: app.toastPosition,
                        transitionIn: app.fadeInAction,
                        transitionOut: app.fadeOutAction,
                        timeout: app.timeout,
                        animateInside: false,
                        iconUrl: app.checkCircleIcon,
                    });
                    $("#onboardingTable").DataTable().ajax.reload(null, false);
                } else {
                    console.log(response);
                }
            },
        });
    }
});
