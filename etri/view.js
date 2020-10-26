{
    "use strict";

    const
        SVG_NS_URI = "http://www.w3.org/2000/svg",
        XLINK_NS_URI = "http://www.w3.org/1999/xlink",
        ICON_SIZE = 40,
        NET_SIZE = 100,
        TEXT_TRIM = 20;

    const
        root = document.createElementNS(SVG_NS_URI, "svg"),
        container = document.createElementNS(SVG_NS_URI, "g"),
        transform = {
            resize: container.transform.baseVal.appendItem(root.createSVGTransform()),
            scale: container.transform.baseVal.appendItem(root.createSVGTransform()),
            translate: container.transform.baseVal.appendItem(root.createSVGTransform())
        },
        layerMap = {
            path: document.createElementNS(SVG_NS_URI, "g"),
            device: document.createElementNS(SVG_NS_URI, "g")
        },
        deviceArray = [],
        deviceMap = {};
    let
        scale = 1,
        intersect, size, dragOrigin;

    document.body.appendChild(root);
    
    for (let name in layerMap) {
        container.appendChild(layerMap[name]);
    }
    
    root.appendChild(container);
    
    window.addEventListener("resize", onResize);

    root.addEventListener("wheel", onScale);
    root.addEventListener("mousedown", onMouseDown);
    root.addEventListener("mouseup", onMouseUp);
    root.addEventListener("mousemove", onMouseMove);
    root.addEventListener("contextmenu", e => e.preventDefault());

    onResize();

    function onScale (e) {
        if (e.deltaY < 0) {
            scale *= 1.1;
        } else {
            scale /= 1.1;
        }

        transform.scale.setScale(scale, scale);
    }

    function onMouseUp(e) {
        e.preventDefault();

        if (e.which !== 1) {
            return;
        }

        const device = getIntersect(e);
        
        if (intersect && (device === intersect)) {
            device.dispatchEvent(new Event("_click"));
        }

        dragOrigin = undefined;
    }

    function onMouseDown(e) {
        e.preventDefault();
        
        if (e.which !== 1) {
            return;
        }
        
        dragOrigin = {
            e: transform.translate.matrix.e,
            f: transform.translate.matrix.f,
            x: e.clientX,
            y: e.clientY
        };

        intersect = getIntersect(e);
    }

    function onMouseMove(e) {
        e.preventDefault();

        if (dragOrigin) {
            intersect = undefined;

            transform.translate.setTranslate(dragOrigin.e + (e.clientX - dragOrigin.x) / scale, dragOrigin.f + (e.clientY - dragOrigin.y) / scale);
        }
    }

    function getIntersect(e) {
        if (e.target !== e.currentTarget) {
            return e.target;
        }
    }

    function onResize() {
        size = document.body.getBoundingClientRect();
        
        transform.resize.setTranslate(size.width /2, size.height /2);
    }

    window.addDevice = function (args) {
        const
            pos = args.position,
            svgDevice = document.createElementNS(SVG_NS_URI, "g"),
            svgIcon = document.createElementNS(SVG_NS_URI, "image"),
            svgLabel = document.createElementNS(SVG_NS_URI, "text"),
            svgAddr = document.createElementNS(SVG_NS_URI, "tspan"),
            svgName = document.createElementNS(SVG_NS_URI, "tspan"),
            svgBG = document.createElementNS(SVG_NS_URI, "circle"),
            size = args.size || ICON_SIZE,
            radius = size * Math.sin(Math.PI /4);

        svgIcon.setAttribute("x", -size /2);
        svgIcon.setAttribute("y", -size /2);
        svgIcon.setAttribute("width", size +"px");
        svgIcon.setAttribute("height", size +"px");
        
        svgDevice.setAttribute("transform", "translate("+ pos.x +","+ pos.y +")");
        
        svgBG.setAttribute("r", radius);
        svgBG.setAttribute("stroke-width", radius);
        svgBG.setAttribute("cx", 0);
        svgBG.setAttribute("cy", 0);

        if (args.id) {
            deviceMap[String(args.id)] = svgDevice;

            svgDevice.dataset.id = args.id;
            //svgDevice.title = args.id;
        }

        if (args.click) {
            svgIcon.addEventListener("_click", args.click);
        }

        if (args.hover) {
            svgIcon.onmouseenter = args.hover;
        }
        
        svgName.textContent = args.name || "";
        svgAddr.textContent = args.ip || "";
        
        svgLabel.appendChild(svgName);
        svgLabel.appendChild(svgAddr);
        
        svgLabel.setAttribute("x", 0);
        svgLabel.setAttribute("y", size *3/4);
        svgLabel.setAttribute("dominant-baseline", "top");

        svgDevice.appendChild(svgBG);
        svgDevice.appendChild(svgIcon);
        svgDevice.appendChild(svgLabel);
        
        svgDevice.classList.add("node");
        
        svgIcon.setAttributeNS(XLINK_NS_URI, "xlink:href", args.icon || "/img/router.svg");
        
        deviceArray.push(svgDevice);

        layerMap.device.appendChild(svgDevice);

        return svgDevice;
    };

    window.addNet = function (args) {
        const
            pos = args.position,
            svgDevice = document.createElementNS(SVG_NS_URI, "g"),
            svgLabel = document.createElementNS(SVG_NS_URI, "text"),
            svgBG = document.createElementNS(SVG_NS_URI, "circle"),
            size = args.size || NET_SIZE,
            radius = size * Math.sin(Math.PI /4);

        svgDevice.setAttribute("transform", "translate("+ pos.x +","+ pos.y +")");
        
        svgBG.setAttribute("r", radius);
        svgBG.setAttribute("cx", 0);
        svgBG.setAttribute("cy", 0);

        if (args.name) {
            const name = document.createElementNS(SVG_NS_URI, "tspan");

            name.textContent = args.name;

            svgLabel.appendChild(name);
        }
        
        svgLabel.setAttribute("x", 0);
        svgLabel.setAttribute("y", -size *3/4);
        svgLabel.setAttribute("dominant-baseline", "hanging");

        svgDevice.appendChild(svgBG);
        svgDevice.appendChild(svgLabel);
        
        svgDevice.classList.add("net");

        layerMap.device.appendChild(svgDevice);
        
        return svgDevice;
    };

    window.addPath = function (args) {
        const
            nodeFrom = args.nodeFrom,
            nodeTo = args.nodeTo,
            labelFrom = args.labelFrom,
            labelTo = args.labelTo,
            svgPath = document.createElementNS(SVG_NS_URI, "g"),
            svgLine = document.createElementNS(SVG_NS_URI, "polyline");
        var x, y;

        svgPath.classList.add("path");

        svgPath.appendChild(svgLine);

        {
            const
                x1 = args.posFrom.x,
                y1 = args.posFrom.y;

            x = args.posTo.x - x1;
            y = args.posTo.y - y1;

            svgLine.setAttribute("points", `0,0 ${x},${y}`);

            svgPath.setAttribute("transform", "translate("+ x1 +","+ y1 +")");
        }

        if (labelFrom) {
            const text = document.createElementNS(SVG_NS_URI, "text");
            let tspan = document.createElementNS(SVG_NS_URI, "tspan");

            svgPath.appendChild(text);

            text.setAttribute("x", x /3);
            text.setAttribute("y", y /3);

            tspan.textContent = " "+ (labelFrom.length >= TEXT_TRIM?
                labelFrom.substring(0, TEXT_TRIM) +"...":
                labelFrom) +" ";

            text.appendChild(tspan);
        }

        if (labelTo) {
            const text = document.createElementNS(SVG_NS_URI, "text");
            let tspan = document.createElementNS(SVG_NS_URI, "tspan");

            svgPath.appendChild(text);

            text.setAttribute("x", x *2/3);
            text.setAttribute("y", y *2/3);
            
            tspan = document.createElementNS(SVG_NS_URI, "tspan");

            tspan.textContent = " "+ (labelTo.length >= TEXT_TRIM?
                labelTo.substring(0, TEXT_TRIM) +"...":
                labelTo) +" ";

            text.appendChild(tspan);
        }

        layerMap.path.appendChild(svgPath);

        return svgPath;
    };

    window.focusDevice = function (id) {
        const device = deviceMap[id];

        if (device) {
            const matrix = device.transform.baseVal.getItem(0).matrix;

            transform.translate.setTranslate(-matrix.e, -matrix.f);

            scale = 0;

            let start;

            const animation = t => {
                if (isNaN(start)) {
                    start = t;
                }
                else {
                    scale = Math.min(1, (t - start) /1000) *3;
        
                    transform.scale.setScale(scale, scale);
        
                    if (scale >= 3) {
                        return;
                    }
                }
        
                requestAnimationFrame(animation);
            };
        
            animation();
        }
    };
}