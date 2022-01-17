const path = require("path");
module.exports = {
    entry: ["./src/js/App.js", "./src/scss/App.scss"],
    output: {
        path: path.resolve(__dirname, "public/build"),
        filename: "js/bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "file-loader",
                        options: { outputPath: "css/", name: "bundle.css" },
                    },
                    "sass-loader",
                ],
            },
        ],
    },
    mode: "development",
};
