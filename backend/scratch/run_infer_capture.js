const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

async function main() {
  const omnivoiceExe = "C:\\Users\\nghia\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\omnivoice-infer.exe";
  const wavOutputPath = path.join(__dirname, "../public/tts/test_capture.wav");
  const refAudioPath = path.join(__dirname, "../../mp3/duy_thanh_nguyen/voice_duy_thanh.wav");

  const relativeWavOutputPath = path.relative(process.cwd(), wavOutputPath);
  const relativeRefAudioPath = path.relative(process.cwd(), refAudioPath);

  const args = [
    "--text", "thử nghiệm ghi nhận phản hồi lỗi",
    "--output", relativeWavOutputPath,
    "--language", "Vietnamese",
    "--speed", "0.95",
    "--ref_audio", relativeRefAudioPath,
    "--ref_text", "Khoảng một hai năm trở lại đây, một ngày mình thức dậy là hàng tá những nội dung về AI đập vào mắt."
  ];

  console.log("Running command:", omnivoiceExe, args.join(" "));

  execFile(omnivoiceExe, args, {
    timeout: 300000,
    env: {
      ...process.env,
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8"
    }
  }, (error, stdout, stderr) => {
    console.log("Finished!");
    console.log("Error object:", error ? error.message : null);
    console.log("Stdout length:", stdout.length);
    console.log("Stderr length:", stderr.length);
    fs.writeFileSync(path.join(__dirname, "infer_stdout.log"), stdout, "utf8");
    fs.writeFileSync(path.join(__dirname, "infer_stderr.log"), stderr, "utf8");
    console.log("Logs written to scratch/infer_stdout.log and scratch/infer_stderr.log");
  });
}

main();
