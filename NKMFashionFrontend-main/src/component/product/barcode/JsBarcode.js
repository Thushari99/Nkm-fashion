// JsBarcode.js
import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const JsBarcodeComponent = ({
  value,
  format = "auto",
  width = 2,
  height = 100,
  displayValue = true,
  fontSize = 18,
  fontOptions = "normal",
  marginBottom = 1,
  marginTop = 1,
  marginLeft = 0,
  marginRight = 0,
  textMargin = 0,
  margin = 0,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      JsBarcode(canvasRef.current, value, {
        format: format, // Specify the barcode format
        width: width, // Width of the barcode bars
        height: height, // Height of the barcode
        displayValue: displayValue, // Show the barcode value below the barcode
        fontSize: fontSize, // Font size for the displayed value
        fontOptions: fontOptions, // Font options for text (normal or bold)
        margin: margin, // Margin around the barcode
        background: "#ffffff", // Background color
        lineColor: "#000000", // Line color
        marginTop: marginTop,
        marginBottom: marginBottom,
        marginRight: marginRight,
        marginLeft: marginLeft,
        textMargin: textMargin,
        font: "fantasy",
      });
    }
  }, [
    value,
    format,
    width,
    height,
    displayValue,
    fontSize,
    fontOptions,
    marginBottom,
    marginTop,
    marginLeft,
    textMargin,
    margin,
  ]);

  return <canvas ref={canvasRef} />;
};

export default JsBarcodeComponent;

