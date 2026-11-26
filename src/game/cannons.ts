export const cannonTypes={
 linear:{label:'Linear',symbol:'↗',color:'#2583ca',form:'y = mx + c'},
 quadratic:{label:'Quadratic',symbol:'∩',color:'#9556c7',form:'y = ax² + bx + c'},
 cubic:{label:'Cubic',symbol:'S',color:'#e18c29',form:'y = ax³ + bx² + cx + d'},
 reciprocal:{label:'Reciprocal',symbol:'1/x',color:'#168e82',form:'y = a/(x − h) + k'},
 exponential:{label:'Exponential',symbol:'↑',color:'#cb4f55',form:'y = abˣ + c'},
 logarithmic:{label:'Logarithmic',symbol:'log',color:'#b57438',form:'y = a log(x − h) + k'},
 wave:{label:'Wave',symbol:'~',color:'#6472d9',form:'y = a sin(bx + c) + d'}
} as const;
export type CannonType=keyof typeof cannonTypes;
