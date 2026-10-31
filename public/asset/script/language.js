$(document).ready(function () {
    $(".sideBarli").removeClass("activeLi");
    $(".languageSideA").addClass("activeLi");

    $("#languageTable").dataTable({
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
            url: `${domainUrl}languageList`,
            data: function (data) {},
        },
    });

    $("#addLanguageForm").on("submit", function (event) {
        event.preventDefault();
        if (user_type == 1) {
            var formdata = new FormData($("#addLanguageForm")[0]);
            console.log(formdata);
            $.ajax({
                url: `${domainUrl}addLanguage`,
                type: "POST",
                data: formdata,
                dataType: "json",
                contentType: false,
                cache: false,
                processData: false,
                success: function (response) {
                    if (response.status == true) {
                        iziToast.show({
                            title: app.Success,
                            message: app.languageAdd,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
                        $("#languageTable")
                            .DataTable()
                            .ajax.reload(null, false);
                        $("#addLanguageModal").modal("hide");
                        $("#addLanguageForm")[0].reset();
                    } else {
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

    $("#languageTable").on("click", ".edit", function (e) {
        e.preventDefault();
        var id = $(this).attr("rel");
        var title = $(this).data("title");

        $("#editLanguageId").val(id);
        $("#edit_title").val(title);
        $("#editLanguageModal").modal("show");
    });

    $("#editLanguageForm").on("submit", function (e) {
        e.preventDefault();
        var id = $("#editLanguageId").val();
        if (user_type == 1) {
            let EditformData = new FormData($("#editLanguageForm")[0]);
            EditformData.append("language_id", id);
            $.ajax({
                type: "POST",
                url: `${domainUrl}updateLanguage`,
                data: EditformData,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.status == true) {
                        iziToast.show({
                            title: app.Success,
                            message: app.languageUpdated,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
                        $("#languageTable")
                            .DataTable()
                            .ajax.reload(null, false);
                        $("#editLanguageModal").modal("hide");
                    } else {
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

    $("#languageTable").on("click", ".delete", function (e) {
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
                            url: `${domainUrl}deleteLanguage`,
                            dataType: "json",
                            data: {
                                language_id: id,
                            },
                            success: function (response) {
                                if (response.status == false) {
                                    console.log(response.message);
                                } else if (response.status == true) {
                                    iziToast.show({
                                        title: app.Success,
                                        message: app.languageDeleted,
                                        color: app.greenToast,
                                        position: app.toastPosition,
                                        transitionIn: app.fadeInAction,
                                        transitionOut: app.fadeOutAction,
                                        timeout: app.timeout,
                                        animateInside: false,
                                        iconUrl: app.checkCircleIcon,
                                    });
                                    $("#languageTable")
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
