const Mat33Old = {
  multiply: (a, b) => {
    const res = new Array(9).fill(0);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          res[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
        }
      }
    }
    return res;
  }
};

const Mat33New = {
  multiply: (a, b) => [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
  ]
};

const a = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const b = [9, 8, 7, 6, 5, 4, 3, 2, 1];

console.log("Old logic output:", Mat33Old.multiply(a, b));
console.log("New logic output:", Mat33New.multiply(a, b));

const iterations = 5000000;

console.time("Old multiply");
let resultOld;
for (let i = 0; i < iterations; i++) {
  resultOld = Mat33Old.multiply(a, b);
}
console.timeEnd("Old multiply");

console.time("New multiply");
let resultNew;
for (let i = 0; i < iterations; i++) {
  resultNew = Mat33New.multiply(a, b);
}
console.timeEnd("New multiply");
