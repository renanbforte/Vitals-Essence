// 3D clay render images mapped by vice strategy ID
import alcoholImg from '@/assets/vice-alcohol.png';
import cigaretteImg from '@/assets/vice-cigarette.png';
import socialMediaImg from '@/assets/vice-social-media.png';
import gamingImg from '@/assets/vice-gaming.png';
import sugarImg from '@/assets/vice-sugar.png';
import junkfoodImg from '@/assets/vice-junkfood.png';
import caffeineImg from '@/assets/vice-caffeine.png';
import sedentarismImg from '@/assets/vice-sedentarism.png';
import buyingImg from '@/assets/vice-buying.png';
import gamblingImg from '@/assets/vice-gambling.png';
import thoughtsImg from '@/assets/vice-thoughts.png';
import energyDrinkImg from '@/assets/vice-energy-drink.png';
import streamingImg from '@/assets/vice-streaming.png';
import lateNightImg from '@/assets/vice-late-night.png';
import angerImg from '@/assets/vice-anger.png';
import shoppingImg from '@/assets/vice-shopping.png';
import snackingImg from '@/assets/vice-snacking.png';
import defaultImg from '@/assets/vice-default.png';

export const VICE_IMAGES: Record<string, string> = {
  alcohol: alcoholImg,
  cigarette: cigaretteImg,
  drugs: caffeineImg, // closest available
  medications: defaultImg,
  caffeine: caffeineImg,
  social_media: socialMediaImg,
  gaming: gamingImg,
  porn: defaultImg,
  youtube: streamingImg,
  phone_bedtime: lateNightImg,
  online_shopping: shoppingImg,
  sugar: sugarImg,
  junk_food: junkfoodImg,
  binge_eating: junkfoodImg,
  snacking: snackingImg,
  procrastination: sedentarismImg,
  negative_thoughts: thoughtsImg,
  impulse_buying: buyingImg,
  nail_biting: defaultImg,
  gossip: thoughtsImg,
  lying: defaultImg,
  comparison: thoughtsImg,
  anger: angerImg,
  anxiety_coping: thoughtsImg,
  self_pity: thoughtsImg,
  sedentarism: sedentarismImg,
  late_nights: lateNightImg,
  excessive_coffee: caffeineImg,
  energy_drinks: energyDrinkImg,
  gambling: gamblingImg,
};

export function getViceImage(viceStrategyId?: string | null): string {
  if (!viceStrategyId) return defaultImg;
  return VICE_IMAGES[viceStrategyId] ?? defaultImg;
}

export { defaultImg as viceDefaultImg };
