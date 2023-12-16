//"use strict";
function create_field() {
   let field = Array();
   for (let y = 0; y < 4; y++) {
      field.push([0, 0, 0, 0]);
   };
   return field;
};

let run = false;
let delay = 100;

function movePress(direction) {

   console.log(direction);

   let map = {
      "left": 37,
      "up": 38,
      "right": 39,
      "down": 40
   };
   document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: map[direction], }));


}


let play = setInterval(step, delay * 10)

chrome.runtime.onMessage.addListener(
   function (request) {
      run = request.run;
      delay = request.delay;
      clearInterval(play);
      play = setInterval(step, delay * 10);
   }
);

function step() {
   function getField() {
      let field = create_field();
      let tiles = document.getElementsByClassName("tile");

      for (let i = 0; i < tiles.length; i++) {
         let tile = tiles.item(i);

         let tile_value = parseInt(tile.getElementsByClassName("tile-inner")[0].innerHTML);

         let pos = tile.className.split(" ").find(elem => elem.includes("tile-position")).split("-").slice(-2)

         let x = parseInt(pos[0] - 1);
         let y = parseInt(pos[1] - 1);

         field[y][x] = Math.max(field[y][x], tile_value);
      }
      return field;
   }
   if (run) {
      let field = getField();
      movePress(predict(field));
   }
}







function movement(field, up = false, right = false, down = false, left = false) {
   if (up || down) {
      return movement_vertical(field, up, down);
   } else if (right || left) {
      return movement_horisontal(field, right, left);
   };
};


function movement_vertical(field, up = false, down = false) {
   let score_up = 0;
   function move(field) {
      let f = [0, 0, 0, 0];

      for (let y = 0; y < 4; y++) {
         for (let x = 0; x < 4; x++) {
            if ((field[y])[x] != 0) {
               let n = (field[y])[x];
               (field[y])[x] = 0;
               (field[f[x]])[x] = n;
               f[x] += 1;
            };
         };
      };
      return field;
   };
   //------------------------------------------------------------------------

   if (down) {
      field.reverse();
   };
   //------------------------------------------------------------------------

   field = move(field);

   for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 4; x++) {
         if ((field[y])[x] == 0) { continue }
         if ((field[y])[x] == (field[y + 1])[x]) {
            score_up += (field[y])[x] * 2;
            (field[y])[x] *= 2;
            (field[y + 1])[x] = 0;
         };
      };
   };

   field = move(field);

   //------------------------------------------------------------------------

   if (down) {
      field.reverse();
   };

   //------------------------------------------------------------------------

   return { field, score_up };
};

function movement_horisontal(field, right = false, left = false) {
   let score_up = 0;
   function move(field) {
      let f = [0, 0, 0, 0];

      for (let x = 0; x < 4; x++) {
         for (let y = 0; y < 4; y++) {
            if ((field[y])[x] != 0) {
               let n = (field[y])[x];
               (field[y])[x] = 0;
               (field[y])[f[y]] = n;
               f[y] += 1;
            };
         };
      };
      return field;
   };

   function rotate_180(field) {
      let f = [[], [], [], []]
      for (let y = 0; y < 4; y++) {
         for (let x = 3; x > -1; x--) {
            f[y].push((field[y])[x]);
         };
      };
      return f;
   };

   //------------------------------------------------------------------------

   if (right) {
      field = rotate_180(field);
   };

   //------------------------------------------------------------------------

   field = move(field);

   for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 4; y++) {
         if ((field[y])[x] == 0) { continue }
         if ((field[y])[x] == (field[y])[x + 1]) {
            score_up += (field[y])[x] * 2;
            (field[y])[x] *= 2;
            (field[y])[x + 1] = 0;
         };
      };
   };


   field = move(field);

   //------------------------------------------------------------------------

   if (right) {
      field = rotate_180(field)
   };

   //------------------------------------------------------------------------

   return { field, score_up };
};




function predict(field) {
   let maxKey = 0;
   let maxValue = 0;
   let dict_importance = {
      "left": 0,
      "up": 0,
      "right": 0
      //"down": 0
   }
   for (const [dir, value] of Object.entries(dict_importance)) {
      let left = false;
      let up = false;
      let right = false;
      let down = false;
      if (dir == "left") { left = true };
      if (dir == "up") { up = true };
      if (dir == "right") { right = true };
      if (dir == "down") { down = true };

      dict_importance[dir] = calc_importance(arr_copy(field), dir, 1, 5)
      console.log(dict_importance)

      if (dict_importance[dir] > maxValue) {
         maxValue = dict_importance[dir]
         maxKey = dir;
      }


   };
   return maxKey
};



function calc_importance(field, dir, actual_range = 1, range = 5) {
   let left = false;
   let up = false;
   let right = false;
   let down = false;
   if (dir == "left") { left = true };
   if (dir == "up") { up = true };
   if (dir == "right") { right = true };
   if (dir == "down") { down = true };


   let importance_up = 0;
   let field_was = arr_copy(field)

   let m = movement(arr_copy(field), up, right, down, left);
   field = m["field"];
   importance_up = m["score_up"] * 2;
   if (JSON.stringify(field) == JSON.stringify(field_was)) {   //check field and field_was are equal
      return 0;
   }



   for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
         if (field[y][x] == 0) {
            let field_2 = arr_copy(field)
            let field_4 = arr_copy(field)
            field_2[y][x] = 2
            field_4[y][x] = 4

            if (actual_range == range) {
               return importance_up +
                  field_importance(arr_copy(field_2)) * 9 +
                  field_importance(arr_copy(field_4));
            } else {
               return importance_up +
                  field_importance(arr_copy(field_2)) * 9 +
                  field_importance(arr_copy(field_4)) +
                  calc_importance(arr_copy(field_2), "left", actual_range + 1, range) +
                  calc_importance(arr_copy(field_2), "up", actual_range + 1, range) +
                  calc_importance(arr_copy(field_2), "right", actual_range + 1, range) +
                  //calc_importance(arr_copy(field_2), "down", actual_range + 1, range) +
                  calc_importance(arr_copy(field_4), "left", actual_range + 1, range) +
                  calc_importance(arr_copy(field_4), "up", actual_range + 1, range) +
                  calc_importance(arr_copy(field_4), "right", actual_range + 1, range) //+
                  //calc_importance(arr_copy(field_4), "down", actual_range + 1, range);
            };


         };
      };
   };

};



function field_importance(field) {


   let importance_up = 0;


   let field_flatten = []
   for (let i = 0; i < field.length; i++) {
      const e = field[i];
      field_flatten.push(i % 2 ? e.reverse() : e)
   }
   field_flatten = [].concat(...field_flatten)


   let field_flatten_sorted = [...field_flatten].sort(function (a, b) {
      return b - a;
   });

   let koef = 64;

   let i = 0
   while (i < field_flatten.length) {
      if (field_flatten[i] >= field_flatten_sorted[i]) {
         importance_up += field_flatten[i] * koef;
         i++
      } else {
         koef/=2
         field_flatten.splice(i, 1);
      };

   };/*
   //add empty tiles on edges

   for (let y = 0; y < 4; y++) {
      field[y].unshift(0)
      field[y].push(0)
   };

   field.unshift([0, 0, 0, 0, 0, 0])
   field.push([0, 0, 0, 0, 0, 0])

   //-----------------------------------------------------------


   for (let y = 1; y < 5; y++) {
      for (let x = 1; x < 5; x++) {
         let actual_tile = field[y][x];
         let tile_left = field[y][x - 1]
         let tile_right = field[y][x + 1]
         let tile_up = field[y - 1][x]
         let tile_down = field[y + 1][x]


         if (actual_tile == tile_left) { importance_up += actual_tile * 3 }
         if (actual_tile == tile_right) { importance_up += actual_tile * 3 }
         if (actual_tile == tile_up) { importance_up += actual_tile * 3 }
         if (actual_tile == tile_down) { importance_up += actual_tile * 3 }

         let l = Math.max(actual_tile, tile_left) / (Math.max(actual_tile, tile_left)/Math.min(actual_tile, tile_left));
         let r = Math.max(actual_tile, tile_right) / (Math.max(actual_tile, tile_right)/Math.min(actual_tile, tile_right));
         let u = Math.max(actual_tile, tile_up) / (Math.max(actual_tile, tile_up)/Math.min(actual_tile, tile_up));
         let d = Math.max(actual_tile, tile_down) / (Math.max(actual_tile, tile_down)/Math.min(actual_tile, tile_down));

         importance_up += l ? l : 0
         importance_up += r ? r : 0
         importance_up += u ? u : 0
         importance_up += d ? d : 0

      };
   };*/
   return importance_up*100;
};


function arr_copy(arr) {
   let arr2 = []
   for (let i = 0; i < arr.length; i++) {
      arr2[i] = arr[i].slice();
   }
   return arr2
}