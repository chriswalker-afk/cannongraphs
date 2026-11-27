export function downloadCustomFile(title:string,raw:string){
 const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download=(title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'custom-level')+'.cannon.json';
 document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
