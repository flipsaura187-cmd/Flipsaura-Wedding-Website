# Hotel Images Folder

Is folder mei aap apne real hotel photos daal sakte hain.

## Folder Structure (Har hotel ke liye alag folder):
Aap seedhe respective hotel ke folder ke andar photos daal sakte hain:

1. `gargee-surya-vihar/`
2. `hotel-us-residency/`
3. `hotel-saraswati-inn/`
4. `hotel-sky-view/`
5. `hotel-madhuram-banquet/`
6. `buddha-resort/`
7. `hotel-raj-residency/`
8. `hotel-vaishnavi-heights/`
9. `hotel-rinkesh-grand/`
10. `hotel-imperial/`
11. `hotel-jhari-palace/`
12. `amit-rest-house/`
13. `diamond-hotel/`
14. `sangam-resort/`
15. `janakpuri-palace/`
16. `janakpuri-resort/`
17. `heaven-resort/`
18. `mehandi-resort/`
19. `five-star-inn/`

*Note: Agar aap bina folder ke seedhe `hotel_images/` mei bhi photo daalenge jiske file name mei hotel ka naam hoga (jaise `buddha_resort.jpg`, `us_residency.png`), script use bhi automatically pehchan legi.*

## Cloudinary Upload & Atlas Sync Command:
Photos daalne ke baad aap bataiye ya ye command run kijiye:
```bash
node --env-file=.env scripts/uploadHotelImagesToCloudinary.js
```
Script automatically:
1. Har image ko Cloudinary par upload karegi.
2. MongoDB Atlas par hotel ke item listings mei Cloudinary photo link update kar degi.
