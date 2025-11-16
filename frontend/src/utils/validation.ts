// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Image URL validation (checks if URL is valid and likely an image)
export const isValidImageUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  
  const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i;
  return imageExtensions.test(url) || url.includes('image') || url.includes('img');
};

// Design name validation
export const isValidDesignName = (name: string): boolean => {
  return name.trim().length > 0 && name.trim().length <= 100;
};

// Comment content validation
export const isValidCommentContent = (content: string): boolean => {
  return content.trim().length > 0 && content.trim().length <= 1000;
};

// Author name validation
export const isValidAuthorName = (name: string): boolean => {
  return name.trim().length > 0 && name.trim().length <= 50;
};

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validate image URL with error message
export const validateImageUrl = (url: string): ValidationResult => {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: 'Image URL is required' };
  }
  
  if (!isValidUrl(url)) {
    return { isValid: false, error: 'Please enter a valid URL (starting with http:// or https://)' };
  }
  
  if (!isValidImageUrl(url)) {
    return { isValid: true, error: 'Warning: This may not be an image URL' };
  }
  
  return { isValid: true };
};

// Validate design name with error message
export const validateDesignName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Design name is required' };
  }
  
  if (name.trim().length > 100) {
    return { isValid: false, error: 'Design name must be 100 characters or less' };
  }
  
  return { isValid: true };
};

