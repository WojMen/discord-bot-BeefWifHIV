module.exports = {
  apps: [
    {
      script: "src/app.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      exec_mode: "cluster",
    },
  ],
};
