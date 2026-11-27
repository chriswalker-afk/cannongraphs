import type {CannonType} from './cannons';
export interface WorldIdentity {
 readonly focus:string;readonly description:string;
 readonly families:readonly CannonType[];
 readonly accent:string;readonly ink:string;readonly tint:string;readonly sky:string;readonly ground:string;
}
// Curriculum summaries describe the intended progression, not answer keys.
export const worldIdentities:Readonly<Record<number,WorldIdentity>>={
 1:{focus:'Straight lines',description:'Build confidence with gradients, intercepts and connected straight-line journeys.',families:['linear'],accent:'#438451',ink:'#285a3b',tint:'#eaf3e1',sky:'#b9e1eb',ground:'#86b26b'},
 2:{focus:'Fractions & negative coordinates',description:'Cross the axes with fractional gradients and intercepts, then reverse your firing direction.',families:['linear'],accent:'#467eac',ink:'#294c76',tint:'#e8f0fa',sky:'#c8dcf1',ground:'#7eb5ae'},
 3:{focus:'Quadratic graphs',description:'Create arches and valleys with transformations, roots and turning points.',families:['quadratic','linear'],accent:'#9262b1',ink:'#63427d',tint:'#f3e9f8',sky:'#d6d6ef',ground:'#a7adc4'},
 4:{focus:'Advanced quadratics',description:'Explore all four quadrants, fractional coefficients and more demanding reverse routes.',families:['quadratic','linear'],accent:'#92713c',ink:'#694d29',tint:'#f4ebd5',sky:'#dce2c7',ground:'#9da26d'},
 5:{focus:'Cubics & reciprocals',description:'Navigate turning points, roots and continuous reciprocal branches through the machinery.',families:['cubic','reciprocal','linear'],accent:'#9d642e',ink:'#75451f',tint:'#f8ead7',sky:'#d3dede',ground:'#87999b'},
 6:{focus:'Exponentials, logs & waves',description:'Explore growth, decay, logarithmic domains and trigonometric graphs, then combine all seven families across the final relays.',families:['exponential','logarithmic','wave'],accent:'#5b63b0',ink:'#3b4288',tint:'#eaeafa',sky:'#d0d4ee',ground:'#9ca6c7'},
 7:{focus:'Vertical translations',description:'Raise and lower the platforms to connect locked gradients and arcs. Then work backwards through the machinery to reach the exit.',families:['linear','quadratic'],accent:'#b08229',ink:'#6c4b1e',tint:'#faefd6',sky:'#d2d5c5',ground:'#cc9e43'}
};
export function identityForWorld(number:number):WorldIdentity{
 const identity=worldIdentities[number];if(!identity)throw new Error('Missing world identity '+number);return identity;
}
