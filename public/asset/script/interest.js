$(document).ready(function () {
    $(".sideBarli").removeClass("activeLi");
    $(".interestsSideA").addClass("activeLi");

    $(".InterestsaddModalbtn").on("click", function (event) {
        event.preventDefault();
        $("#addForm")[0].reset();
    });

    $("#interestTable").dataTable({
        processing: true,
        serverSide: true,
        serverMethod: "post",
        aaSorting: [[0, "desc"]],
        columnDefs: [
            {
                targets: [0, 1],
                orderable: false,
            },
        ],
        ajax: {
            url: `${domainUrl}fetchAllInterest`,
            data: function (data) {},
        },
    });

    $("#addForm").on("submit", function (event) {
        event.preventDefault();
        if (user_type == 1) {
            var formdata = new FormData($("#addForm")[0]);
            $.ajax({
                url: `${domainUrl}addInterest`,
                type: "POST",
                data: formdata,
                dataType: "json",
                contentType: false,
                cache: false,
                processData: false,
                success: function (response) {
                    if (response.status == false) {
                        iziToast.show({
                            title: app.Error,
                            message: response.message,
                            color: app.redToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.cancleIcon,
                        });
                    } else if (response.status == true) {
                        iziToast.show({
                            title: app.Success,
                            message: app.interestAdd,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
                        $("#interestTable")
                            .DataTable()
                            .ajax.reload(null, false);
                        $("#addInterest").modal("hide");
                        $("#addForm")[0].reset();
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

    $("#interestTable").on("click", ".edit", function (e) {
        e.preventDefault();
        var id = $(this).attr("rel");
        var title = $(this).data("title");
        $("#editInterstId").val(id);
        $("#editInterstTitle").val(title);
        $("#editInterestModal").modal("show");
    });

    $(document).on("submit", "#editInterestForm", function (e) {
        e.preventDefault();
        var id = $("#editInterstId").val();
        if (user_type == 1) {
            let EditformData = new FormData($("#editInterestForm")[0]);
            EditformData.append("interest_id", id);
            $.ajax({
                type: "POST",
                url: `${domainUrl}updateInterest`,
                data: EditformData,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.status == false) {
                        iziToast.show({
                            title: app.Error,
                            message: response.message,
                            color: app.redToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.cancleIcon,
                        });
                    } else if (response.status == true) {
                        iziToast.show({
                            title: app.Success,
                            message: app.interestUpdated,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
                        $("#interestTable").DataTable().ajax.reload(null, false);
                        $("#editInterestModal").modal("hide");
                    } else if (response.status == 422) {
                        iziToast.show({
                            title: app.Success,
                            message: response.message,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
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

    $("#interestTable").on("click", ".delete", function (e) {
        e.preventDefault();
        var id = $(this).attr("rel");
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
                            url: `${domainUrl}deleteInterest`,
                            dataType: "json",
                            data: {
                                interest_id: id,
                            },
                            success: function (response) {
                                if (response.status == false) {
                                    console.log(response.message);
                                } else if (response.status == true) {
                                    iziToast.show({
                                        title: app.Success,
                                        message: app.interestDeleted,
                                        color: app.greenToast,
                                        position: app.toastPosition,
                                        transitionIn: app.fadeInAction,
                                        transitionOut: app.fadeOutAction,
                                        timeout: app.timeout,
                                        animateInside: false,
                                        iconUrl: app.checkCircleIcon,
                                    });
                                    $("#interestTable")
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
});
