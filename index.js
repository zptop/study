function fun3(){
    console.log('003');
}

function fun2(){
    fun3();
}

function fun1(){
    fun2();
}

fun1();