// lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function getGalleryImages(folderName) {
  try {
    let allResources = [];
    let nextCursor = null;

    do {
      const result = await cloudinary.search
        .expression(`folder:${folderName}`)
        .sort_by('public_id', 'desc')
        .max_results(500)
        .next_cursor(nextCursor)
        .execute();
      
      allResources = allResources.concat(result.resources);
      nextCursor = result.next_cursor;
    } while (nextCursor);

    const images = allResources.map(resource => {
      // --- EZ AZ ÚJ, FONTOS RÉSZ ---
      // Beillesztjük az f_auto,q_auto transzformációt az URL-be
      const transformation = 'f_auto,q_auto';
      const urlParts = resource.secure_url.split('/upload/');
      const transformedUrl = `${urlParts[0]}/upload/${transformation}/${urlParts[1]}`;
      // -----------------------------

      return {
        id: resource.public_id,
        publicId: resource.public_id,
        src: transformedUrl, // Az átalakított URL-t használjuk
        width: resource.width,
        height: resource.height,
      };
    });

    return images;
  } catch (error) {
    console.error("Cloudinary hiba:", error);
    return [];
  }
}