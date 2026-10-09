export interface Appearance {
  hair:'cap'|'short'|'helmet'|'none';hairColor:string;capFacing?:'forward'|'backward';
  face:'smile'|'confident'|'glasses'|'grin'|'visor'|'plain';skinTone:string;
  torso:'hoodie'|'jacket'|'engineer'|'knit'|'flight'|'plain';torsoColor:string;
  legs:string;legColor:string;accessory:'backpack'|'headphones'|'satchel'|'none';accentColor?:string;
}
// Toy designs, not a claim about anyone's real appearance.
export const residentAppearances:Appearance[]=[
  {hair:'short',hairColor:'#582a12',face:'glasses',skinTone:'#f2cd37',torso:'knit',torsoColor:'#a0bcac',legs:'standard',legColor:'#582a12',accessory:'headphones',accentColor:'#e4cd9e'},
  {hair:'cap',hairColor:'#720e0f',face:'grin',skinTone:'#f2cd37',torso:'jacket',torsoColor:'#0a3463',legs:'standard',legColor:'#9ba19d',accessory:'satchel',accentColor:'#c91a09'},
  {hair:'short',hairColor:'#05131d',face:'confident',skinTone:'#f2cd37',torso:'engineer',torsoColor:'#fe8a18',legs:'standard',legColor:'#0a3463',accessory:'none',accentColor:'#e4cd9e'},
];
