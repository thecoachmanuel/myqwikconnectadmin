$(document).ready(function () {
    $(".sideBarli").removeClass("activeLi");
    $(".relationshipGoalSideA").addClass("activeLi");

    $("#relationshipGoalTable").dataTable({
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
            url: `${domainUrl}relationshipGoalList`,
            data: function (data) {},
        },
    });

    $("#addRelationshipGoalForm").on("submit", function (event) {
        event.preventDefault();
        if (user_type == 1) {
            var formdata = new FormData($("#addRelationshipGoalForm")[0]);
            console.log(formdata);
            $.ajax({
                url: `${domainUrl}addRelationshipGoal`,
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
                            message: app.relationshipGoalAdd,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
                        $("#relationshipGoalTable")
                            .DataTable()
                            .ajax.reload(null, false);
                        $("#addRelationshipGoalModal").modal("hide");
                        $("#addRelationshipGoalForm")[0].reset();
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

    $("#relationshipGoalTable").on("click", ".edit", function (e) {
        e.preventDefault();
        var id = $(this).attr("rel");
        var title = $(this).data("title");
        var description = $(this).data("description");

        $("#editRelationshipGoalId").val(id);
        $("#edit_title").val(title);
        $("#edit_description").val(description);
        $("#editRelationshipGoalModal").modal("show");
    });

    $("#editRelationshipGoalForm").on("submit", function (e) {
        e.preventDefault();
        var id = $("#editRelationshipGoalId").val();
        if (user_type == 1) {
            let EditformData = new FormData($("#editRelationshipGoalForm")[0]);
            EditformData.append("relationship_goal_id", id);
            $.ajax({
                type: "POST",
                url: `${domainUrl}updateRelationshipGoal`,
                data: EditformData,
                contentType: false,
                processData: false,
                success: function (response) {
                    if (response.status == true) {
                        iziToast.show({
                            title: app.Success,
                            message: app.relationshipGoalUpdated,
                            color: app.greenToast,
                            position: app.toastPosition,
                            transitionIn: app.fadeInAction,
                            transitionOut: app.fadeOutAction,
                            timeout: app.timeout,
                            animateInside: false,
                            iconUrl: app.checkCircleIcon,
                        });
                        $("#relationshipGoalTable")
                            .DataTable()
                            .ajax.reload(null, false);
                        $("#editRelationshipGoalModal").modal("hide");
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

    $("#relationshipGoalTable").on("click", ".delete", function (e) {
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
                            url: `${domainUrl}deleteRelationshipGoal`,
                            dataType: "json",
                            data: {
                                relationship_goal_id: id,
                            },
                            success: function (response) {
                                if (response.status == false) {
                                    console.log(response.message);
                                } else if (response.status == true) {
                                    iziToast.show({
                                        title: app.Success,
                                        message: app.relationshipGoalDeleted,
                                        color: app.greenToast,
                                        position: app.toastPosition,
                                        transitionIn: app.fadeInAction,
                                        transitionOut: app.fadeOutAction,
                                        timeout: app.timeout,
                                        animateInside: false,
                                        iconUrl: app.checkCircleIcon,
                                    });
                                    $("#relationshipGoalTable")
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
