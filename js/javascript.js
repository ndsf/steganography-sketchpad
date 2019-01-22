$(document).ready(function () {
    var panning = false;
    var circles = [];
    var selected = null;
    var editor_canvas = new fabric.Canvas("editor_canvas");

    $(window).resize(function () {
        clearTimeout(window.resizedFinished);
        window.resizedFinished = setTimeout(function () {
            resizeCanvas();
        }, 250);
    });

    resizeCanvas();

    function resizeCanvas() {
        editor_canvas.setHeight(window.innerHeight / 2);
        editor_canvas.setWidth($("#editor_canvas_div").width());
        editor_canvas.renderAll();
    }

    $("#file").change(function () {
        editor_canvas.clear();
        var img = new Image();
        img.onload = function () {
            var image = new fabric.Image(this);
            editor_canvas.setBackgroundImage(image, editor_canvas.renderAll.bind(editor_canvas), {
                originX: 'left',
                originY: 'top'
            });
            zoomToFitCanvas(0, 0, img.width, img.height);
            //editor_canvas.width = this.width;
            //editor_canvas.height = this.height;
        };
        img.src = URL.createObjectURL(this.files[0]);

        //$("#editor_canvas").css("background-image", 'url("' + URL.createObjectURL(this.files[0]) + '")');

        readIMG();

    });

    $("#clear_button").click(function (event) {
        circles = [];
        selected = null;
        editor_canvas.clear();
    });

    function createCircle(x, y, msg) {
        var radius = 10;
        //var colors = ["green", "blue", "red", "yellow", "magenta", "orange", "brown",
        //    "purple", "pink"];
        //var color = colors[randomFromTo(0, 8)];
        var circle = new fabric.Circle({radius: radius, left: x, top: y, fill: 'green', hasControls: false});
        var temp = {circle: circle, text: msg};
        circle.on('selected', function () {
            selected = temp;
            $("#input_input").val(temp.text);
        });
        return temp;
    }

    $("#add_button").click(function (event) {
        var temp = createCircle(editor_canvas.width / 2, editor_canvas.height / 2, "");
        editor_canvas.add(temp.circle);
        circles.push(temp);
    });

    $("#remove_button").click(function (event) {
        for (var i = 0; i < circles.length; i++) {
            if (circles[i].circle == editor_canvas.getActiveObject()) {
                console.log("Succfully removed!");
                circles.splice(i, 1);
            }
        }
        selected = null;
        editor_canvas.remove(editor_canvas.getActiveObject());
    });

    editor_canvas.on('mouse:wheel', function (opt) {
        var delta = opt.e.deltaY;
        var pointer = this.getPointer(opt.e);
        var zoom = this.getZoom();
        zoom = zoom + delta / 200;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        this.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });

    editor_canvas.on('mouse:over', function (e) {
        if (e.target) {
            e.target.set('fill', 'red');
            for (var i = 0; i < circles.length; i++)
                if (circles[i].circle == e.target)
                    $("#tooltip_div").text("Tooltip: " + circles[i].text);
            this.renderAll();
        }
    });

    editor_canvas.on('mouse:out', function (e) {
        if (e.target) {
            e.target.set('fill', 'green');
            $("#tooltip_div").text("Hover over the circles to show tooltip. Hold alt to drag around. Use the mouse wheel to zoom.");
            this.renderAll();
        }
    });

    function zoomToFitCanvas(minX, minY, maxX, maxY) {
        //计算平移坐标
        console.log(minX, minY, maxX, maxY);
        var panX = (maxX - minX - editor_canvas.width) / 2 + minX;
        var panY = (maxY - minY - editor_canvas.height) / 2 + minY;
        //开始平移
        editor_canvas.absolutePan({x: panX, y: panY});

        //计算缩放比例
        var zoom = Math.min(editor_canvas.width / (maxX - minX), editor_canvas.height / (maxY - minY));
        //计算缩放中心
        var zoomPoint = new fabric.Point(editor_canvas.width / 2, editor_canvas.height / 2);
        //开始缩放
        editor_canvas.zoomToPoint(zoomPoint, zoom);
    }

    editor_canvas.on('mouse:down', function (e) {
        //按住alt键才可拖动画布
        if(e.e.altKey) {
            panning = true;
            this.selection = false;
        }
    });

    //鼠标抬起
    editor_canvas.on('mouse:up', function (e) {
        panning = false;
        this.selection = true;
    });

    //鼠标移动
    editor_canvas.on('mouse:move', function (e) {
        if (panning && e && e.e) {
            var delta = new fabric.Point(e.e.movementX, e.e.movementY);
            this.relativePan(delta);
        }
    });
    /*
    editor_canvas.on('mouse:down', function (opt) {
        var evt = opt.e;
        if (evt.altKey === true) {
            this.isDragging = true;
            this.selection = false;
            this.lastPosX = evt.clientX;
            this.lastPosY = evt.clientY;
        }
    });
    editor_canvas.on('mouse:move', function (opt) {
        if (this.isDragging) {
            var e = opt.e;
            this.viewportTransform[4] += e.clientX - this.lastPosX;
            this.viewportTransform[5] += e.clientY - this.lastPosY;
            this.requestRenderAll();
            this.lastPosX = e.clientX;
            this.lastPosY = e.clientY;
        }
    });
    editor_canvas.on('mouse:up', function (opt) {
        this.isDragging = false;
        this.selection = true;
    });
    */
    $("#input_input").on('input', function (event) {
        selected.text = $("#input_input").val();
    });

    $("#build_button").click(function (event) {
        var temp = [];
        for (var i = 0; i < circles.length; i++)
            temp.push({x: circles[i].circle.left, y: circles[i].circle.top, text: circles[i].text});
        var str = JSON.stringify(temp);
        //console.log(JSON.stringify(editor_canvas));
        $("#str_p").text(str);
        writeIMG();
        $("#result_download").attr('download', new Date());
    })

    $("#read_button").click(function (event) {
        readIMG();
    });

    function randomFromTo(st, ed) {
        return Math.floor(Math.random() * (ed - st + 1) + st);
    }

    function writeIMG() {
        $("#result_div").hide();
        $("#resultimg").attr('src', '');
        $("#result_download").attr('src', '');
        $("#result").html('Processing...');

        function writefunc() {
            //var selectedVal = '';
            //var selected = $("input[type='radio'][name='mode']:checked");
            /*if (selected.length > 0) {
                selectedVal = selected.val();
            }*/
            //var t = writeMsgToCanvas('canvas', $("#msg").val(), $("#pass").val(), selectedVal);
            var t = writeMsgToCanvas('canvas', $("#str_p").text(), '', 0);
            console.log("write=" + $("#str_p").text());
            if (t != null) {
                var myCanvas = document.getElementById("canvas");
                var image = myCanvas.toDataURL("image/png");
                $("#resultimg").attr('src', image);
                $("#result_download").attr('href', image);
                $("#result").html('Success! Save the result image below and send it to others!');
                $("#result_div").show();
            }
        }

        loadIMGtoCanvas('file', 'canvas', writefunc, -1);
    }

    function readIMG() {
        $("#result_div").hide();
        $("#result").html('Processing...');

        function readfunc() {
            /*var selectedVal = '';
            var selected = $("input[type='radio'][name='mode']:checked");
            if (selected.length > 0) {
                selectedVal = selected.val();
            }*/
            //var t = readMsgFromCanvas('canvas', $("#pass").val(), selectedVal);
            var t = readMsgFromCanvas('canvas', '', 0);
            //if (t != null) {
            if (t.startsWith("[")) {
                t = t.split('&').join('&amp;');
                t = t.split(' ').join('&nbsp;');
                t = t.split('<').join('&lt;');
                t = t.split('>').join('&gt;');
                t = t.replace(/(?:\r\n|\r|\n)/g, '<br />');
                console.log("t=" + t);
                var result = JSON.parse(t);
                console.log(result.length);
                for (var i = 0; i < result.length; i++) {
                    var temp = createCircle(result[i].x, result[i].y, result[i].text);
                    editor_canvas.add(temp.circle);
                    circles.push(temp);
                }
                //   drawCircles();
                $("#result").html(t);

            } else $("#result").html('ERROR REAVEALING MESSAGE!');

        }

        loadIMGtoCanvas('file', 'canvas', readfunc);
    }
});
