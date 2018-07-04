var obj = {
    "name": "tom",
    "age": "28",
    "sex": "male"
}

function getJsonLength(jsonData) {
    var length = 0;
    for(var ever in jsonData) {
        length++;
    }
    return length;
}

// var obj2 = JSON.parse(obj)
    
// obj.forEach(element => {
//     console.log(element);
    
// });



var jsonStr = '{"name":"zhangsan","age":23,"email":"chentging@aliyun.com"}';
var json = JSON.parse(jsonStr);
json.forEach(function(el){

})



// console.log(getJsonLength(obj));
