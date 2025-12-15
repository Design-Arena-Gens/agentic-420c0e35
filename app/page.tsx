'use client';

import { useState } from 'react';
import ImageEditor from './components/ImageEditor';
import { Upload } from 'lucide-react';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setShowEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateNew = () => {
    setSelectedImage(null);
    setShowEditor(true);
  };

  const handleBack = () => {
    setShowEditor(false);
    setSelectedImage(null);
  };

  if (showEditor) {
    return <ImageEditor initialImage={selectedImage} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Image Editor
          </h1>
          <p className="text-xl text-gray-600">
            Powered by Nano Banana Pro - Professional Image Editing with AI
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Upload Image Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Image</h2>
              <p className="text-gray-600 text-center mb-6">
                Upload an existing image to edit with AI-powered tools
              </p>
              <label className="w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-center cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all">
                  Choose Image
                </div>
              </label>
            </div>
          </div>

          {/* Create New Canvas Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Canvas</h2>
              <p className="text-gray-600 text-center mb-6">
                Start with a blank canvas and create something amazing
              </p>
              <button
                onClick={handleCreateNew}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-pink-700 hover:to-purple-700 transition-all"
              >
                Create New
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-800">Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/70 backdrop-blur rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🎨</div>
              <h4 className="font-semibold mb-2">AI-Powered Editing</h4>
              <p className="text-sm text-gray-600">Mark areas and let AI transform them</p>
            </div>
            <div className="bg-white/70 backdrop-blur rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">✏️</div>
              <h4 className="font-semibold mb-2">Pencil Tool</h4>
              <p className="text-sm text-gray-600">Draw and mark specific regions</p>
            </div>
            <div className="bg-white/70 backdrop-blur rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">💾</div>
              <h4 className="font-semibold mb-2">Export & Save</h4>
              <p className="text-sm text-gray-600">Download your edited images</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
