var wait = ms => new Promise((r, j)=>setTimeout(r, ms))

async function l(str){
    let a = str.split("");
    for(var c in a){
        process.stdout.write(a[c]);
        await wait(25);
    }
    process.stdout.write("\n");
    return ;
}
(async function(){
    await l("lol");
    await l("kek");
})()