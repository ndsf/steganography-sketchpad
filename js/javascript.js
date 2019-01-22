$(function () {
    let currentImage = new fabric.Image("tutorial_img");
    let panning = false;
    let circles = [];
    let selected = null;
    const editor_canvas = new fabric.Canvas("editor_canvas");

    $(window).on({
        "resize": function () {
            clearTimeout(window.resizedFinished);
            window.resizedFinished = setTimeout(function () {
                resizeCanvas();
                if (currentImage)
                    zoomToFitCanvas(0, 0, currentImage.width, currentImage.height);
            }, 250);
        }
    });

    resizeCanvas();

    function resizeCanvas() {
        editor_canvas.setHeight(window.innerHeight);
        editor_canvas.setWidth($("#editor_canvas_div").width());
        editor_canvas.renderAll();
    }

    const tutorial = new fabric.Image("tutorial_img");
    editor_canvas.setBackgroundImage(tutorial, editor_canvas.renderAll.bind(editor_canvas), {
        originX: "left",
        originY: "top"
    });
    zoomToFitCanvas(0, 0, tutorial.width, tutorial.height);

    $("#upload_link").on({
        "click": function (e) {
            e.preventDefault();
            $("#file").trigger("click");
        }
    });

    $("#file").on({
        "change": function () {
            circles = [];
            selected = null;
            editor_canvas.clear();
            const img = new Image();
            img.onload = function () {
                const image = new fabric.Image(this);
                editor_canvas.setBackgroundImage(image, editor_canvas.renderAll.bind(editor_canvas), {
                    originX: "left",
                    originY: "top"
                });
                zoomToFitCanvas(0, 0, img.width, img.height);
                currentImage = img;
            };
            img.src = URL.createObjectURL(this.files[0]);
            readIMG();
        }
    });

    function createCircle(x, y, msg) {
        const radius = currentImage.width / 50;
        const circle = new fabric.Circle({
            radius: radius,
            left: x,
            top: y,
            fill: "magenta",
            stroke: "orange",
            strokeWidth: radius / 10,
            hasControls: false
        });
        const temp = {circle: circle, text: msg};
        circle.on({
            "selected": function () {
                selected = temp;
                $("#input_input").val(temp.text);
            }
        });
        return temp;
    }

    $("#add_button").on({
        "click": function () {
            const temp = createCircle(editor_canvas.width * (0.3 + Math.random() * 0.4), editor_canvas.height * (0.3 + Math.random() * 0.4), "");
            editor_canvas.add(temp.circle);
            circles.push(temp);
        }
    });

    $("#remove_button").on({
        "click": function () {
            for (let i = 0; i < circles.length; i++)
                if (circles[i].circle === editor_canvas.getActiveObject())
                    circles.splice(i, 1);
            selected = null;
            editor_canvas.remove(editor_canvas.getActiveObject());
        }
    });

    function zoomToFitCanvas(minX, minY, maxX, maxY) {
        const panX = (maxX - minX - editor_canvas.width) / 2 + minX;
        const panY = (maxY - minY - editor_canvas.height) / 2 + minY;
        editor_canvas.absolutePan({x: panX, y: panY});
        editor_canvas.viewportTransform[0] = editor_canvas.viewportTransform[3] = 1;
        editor_canvas.viewportTransform[1] = editor_canvas.viewportTransform[2] = 0;
        const zoom = Math.min(editor_canvas.width / (maxX - minX), editor_canvas.height / (maxY - minY));
        const zoomPoint = new fabric.Point(editor_canvas.width / 2, editor_canvas.height / 2);
        editor_canvas.zoomToPoint(zoomPoint, zoom);
    }

    editor_canvas.on({
        "mouse:down": function (e) {
            if (e.e.altKey) {
                panning = true;
                this.selection = false;
            }
        },
        "mouse:up": function () {
            panning = false;
            this.selection = true;
        },
        "mouse:move": function (e) {
            if (panning && e && e.e) {
                const delta = new fabric.Point(e.e.movementX, e.e.movementY);
                this.relativePan(delta);
            }
        },
        /*"touch:gesture": function (event) {
            isGestureEvent = true;
            let lPinchScale = event.self.scale;
            let scaleDiff = (lPinchScale - 1) / 10 + 1;  // Slow down zoom speed
            this.setZoom(self.viewport.zoom * scaleDiff);

            const delta = opt.e.deltaY;
            let zoom = this.getZoom();
            zoom = zoom + delta / 200;
            if (zoom > 2) zoom = 2;
            if (zoom < 0.1) zoom = 0.1;
            this.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        },*/
        'touch:gesture': function(e) {
            console.log(e);
            if (e.e.touches && e.e.touches.length === 2) {
                //pausePanning = true;
                var zoomStartScale = 0;
                var point = new fabric.Point(e.self.x, e.self.y);
                if (e.self.state === "start") {
                    zoomStartScale = self.canvas.getZoom();
                }
                var delta = zoomStartScale * e.self.scale;
                self.canvas.zoomToPoint(point, delta);
                //pausePanning = false;
            }
        },
        "mouse:wheel": function (opt) {
            const delta = opt.e.deltaY;
            let zoom = this.getZoom();
            zoom = zoom + delta / 200;
            if (zoom > 2) zoom = 2;
            if (zoom < 0.1) zoom = 0.1;
            this.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, zoom);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        },
        "mouse:over": function (e) {
            if (e.target) {
                e.target.set("fill", "red");
                for (let i = 0; i < circles.length; i++)
                    if (circles[i].circle === e.target)
                        $("#input_input").val(circles[i].text);
                this.renderAll();
            }
        },
        "mouse:out": function (e) {
            if (e.target) {
                e.target.set("fill", "magenta");
                if (selected)
                    $("#input_input").val(selected.text);
                this.renderAll();
            }
        }
    });

    $("#input_input").on({
        "input": function () {
            selected.text = $("#input_input").val();
        }
    });

    $("#build_button").on({
        "click": function () {
            const temp = [];
            for (let i = 0; i < circles.length; i++)
                temp.push({x: circles[i].circle.left, y: circles[i].circle.top, text: circles[i].text});
            const str = JSON.stringify(temp);
            $("#str_p").text(str);
            writeIMG();
            $("#result_download").attr("download", new Date());
        }
    });

    $("#read_button").on({
        "click": function () {
            readIMG();
        }
    });

    function writeIMG() {
        $("#result_div").hide();
        $("#resultimg").attr("src", "");
        $("#result_download").attr("src", "");
        $("#result").html("Processing...");

        function writefunc() {
            const t = writeMsgToCanvas("canvas", $("#str_p").text(), "", 0);
            if (t != null) {
                const myCanvas = document.getElementById("canvas");
                const image = myCanvas.toDataURL("image/png");
                $("#resultimg").attr("src", image);
                $("#result_download").attr("href", image);
                $("#result").html("Success! Save the result image below and send it to others!");
                $("#result_div").show();
            }
        }

        loadIMGtoCanvas("file", "canvas", writefunc, -1);
    }

    function readIMG() {
        $("#result_div").hide();
        $("#result").html("Processing...");

        function readfunc() {
            let t = readMsgFromCanvas("canvas", "", 0);
            if (t.startsWith("[")) {
                t = t.split("&").join("&amp;");
                t = t.split(" ").join("&nbsp;");
                t = t.split("<").join("&lt;");
                t = t.split(">").join("&gt;");
                t = t.replace(/(?:\r\n|\r|\n)/g, "<br />");
                const result = JSON.parse(t);
                for (let i = 0; i < result.length; i++) {
                    const temp = createCircle(result[i].x, result[i].y, result[i].text);
                    editor_canvas.add(temp.circle);
                    circles.push(temp);
                }
                $("#result").html(t);
            } else $("#result").html("ERROR!");
        }

        loadIMGtoCanvas("file", "canvas", readfunc);
    }
});
