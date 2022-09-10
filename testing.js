const arr = [2, 4, 5, 2, 4, 2, 1, 5, 3];

function count(arr) {
  return arr.reduce(
    (prev, curr) => ((prev[curr] = ++prev[curr] || 1), prev),
    {}
  );
}

console.log(count(arr));

let getEvenNumbers = (num) => {
  if (num % 2 === 0) {
    console.log(num, " -- EVEN");
  } else {
    console.log(num, " -- ODD");
  }
};

const checkEven = [1, 2, 3, 4, 5, 6];
checkEven.forEach(getEvenNumbers);
