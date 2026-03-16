import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Save } from 'lucide-react';

export const ManageConfig: React.FC = () => {
  const { config, refreshData } = useData();
  const [formData, setFormData] = useState(config || {} as any);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleStatsChange = (field: string, value: any) => {
    handleChange('stats', field, value);
  };

  const handleProfileChange = (field: string, value: any) => {
    handleChange('profile', field, value);
  };

  const handleHeroChange = (field: string, value: any) => {
    handleChange('hero', field, value);
  };

  const handleThemeChange = (field: string, value: any) => {
    handleChange('theme', field, value);
  };

  const handleMusicChange = (field: string, value: any) => {
    handleChange('music', field, value);
  };

  const handleFooterChange = (field: string, value: any) => {
    handleChange('footer', field, value);
  };

  const handleAboutChange = (field: string, value: any) => {
    handleChange('about', field, value);
  };

  const handleAboutSkillsChange = (index: number, value: string) => {
    setFormData((prev: any) => {
      const newSkills = [...(prev.about?.skills || [])];
      newSkills[index] = value;
      return {
        ...prev,
        about: {
          ...prev.about,
          skills: newSkills
        }
      };
    });
  };

  const addAboutSkill = () => {
    setFormData((prev: any) => ({
      ...prev,
      about: {
        ...prev.about,
        skills: [...(prev.about?.skills || []), '']
      }
    }));
  };

  const removeAboutSkill = (index: number) => {
    setFormData((prev: any) => {
      const newSkills = [...(prev.about?.skills || [])];
      newSkills.splice(index, 1);
      return {
        ...prev,
        about: {
          ...prev.about,
          skills: newSkills
        }
      };
    });
  };

  const handleSocialChange = (index: number, field: string, value: string) => {
    setFormData((prev: any) => {
      const newSocial = [...(prev.social || [])];
      newSocial[index] = { ...newSocial[index], [field]: value };
      return { ...prev, social: newSocial };
    });
  };

  const addSocial = () => {
    setFormData((prev: any) => ({
      ...prev,
      social: [...(prev.social || []), { platform: '', url: '' }]
    }));
  };

  const removeSocial = (index: number) => {
    setFormData((prev: any) => {
      const newSocial = [...(prev.social || [])];
      newSocial.splice(index, 1);
      return { ...prev, social: newSocial };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await refreshData();
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Manage global site configuration.</p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium shadow-sm disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* General Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Domain</label>
              <input 
                type="text" 
                value={formData.domain || ''}
                onChange={e => handleChange('', 'domain', e.target.value)}
                placeholder="blog.wineryz.top"
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Author Name</label>
              <input 
                type="text" 
                value={formData.author || ''}
                onChange={e => handleChange('', 'author', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-text-primary">Site Title</label>
              <input 
                type="text" 
                value={formData.title || ''}
                onChange={e => handleChange('', 'title', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-text-primary">Site Subtitle</label>
              <input 
                type="text" 
                value={formData.subtitle || ''}
                onChange={e => handleChange('', 'subtitle', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Hero Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">Hero Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Hero Title</label>
              <input 
                type="text" 
                value={formData.hero?.title || ''}
                onChange={e => handleHeroChange('title', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Hero Subtitle</label>
              <input 
                type="text" 
                value={formData.hero?.subtitle || ''}
                onChange={e => handleHeroChange('subtitle', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Background Image URL</label>
              <input 
                type="text" 
                value={formData.hero?.image || ''}
                onChange={e => handleHeroChange('image', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Image Credit</label>
              <input 
                type="text" 
                value={formData.hero?.credit || ''}
                onChange={e => handleHeroChange('credit', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Profile Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">Profile Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Display Name</label>
              <input 
                type="text" 
                value={formData.profile?.name || ''}
                onChange={e => handleProfileChange('name', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Avatar URL</label>
              <input 
                type="text" 
                value={formData.profile?.avatar || ''}
                onChange={e => handleProfileChange('avatar', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-text-primary">Bio</label>
              <textarea 
                value={formData.profile?.bio || ''}
                onChange={e => handleProfileChange('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors resize-none"
              />
            </div>
          </div>
        </section>

        {/* Stats Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">Manual Stats Overrides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Total Words</label>
              <input 
                type="text" 
                value={formData.stats?.words || ''}
                onChange={e => handleStatsChange('words', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Running Days</label>
              <input 
                type="number" 
                value={formData.stats?.runningDays || 0}
                onChange={e => handleStatsChange('runningDays', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Last Activity</label>
              <input 
                type="text" 
                value={formData.stats?.lastActivity || ''}
                onChange={e => handleStatsChange('lastActivity', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Theme Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">Theme & Appearance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Accent Color (Hex)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={formData.theme?.accentColor || '#F27D26'}
                  onChange={e => handleThemeChange('accentColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={formData.theme?.accentColor || '#F27D26'}
                  onChange={e => handleThemeChange('accentColor', e.target.value)}
                  className="flex-1 px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors uppercase"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Custom Cursor URL</label>
              <input 
                type="text" 
                placeholder="e.g., /cursor.png"
                value={formData.theme?.cursorUrl || ''}
                onChange={e => handleThemeChange('cursorUrl', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Global Background URL</label>
              <input 
                type="text" 
                placeholder="e.g., /bg.jpg"
                value={formData.theme?.globalBackground || ''}
                onChange={e => handleThemeChange('globalBackground', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Wave Effects Settings */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4">Wave Effects</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Enable Wave Effects</label>
                <div className="flex items-center gap-3 mt-2">
                  <input 
                    type="checkbox" 
                    id="waveEnabled"
                    checked={formData.theme?.waveEnabled !== false}
                    onChange={e => handleThemeChange('waveEnabled', e.target.checked)}
                    className="w-4 h-4 text-accent bg-bg-base border-border rounded focus:ring-accent"
                  />
                  <label htmlFor="waveEnabled" className="text-sm font-medium text-text-primary cursor-pointer">
                    Enable animated wave transitions
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Wave Style</label>
                <select 
                  value={formData.theme?.waveStyle || 'smooth'}
                  onChange={e => handleThemeChange('waveStyle', e.target.value)}
                  className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="smooth">Smooth (SVG Gradient)</option>
                  <option value="dynamic">Dynamic (Particle Wave)</option>
                </select>
                <p className="text-xs text-text-muted">
                  Smooth: Elegant layered waves with gradients<br/>
                  Dynamic: Animated particles following wave patterns
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Wave Speed</label>
                <select 
                  value={formData.theme?.waveSpeed || 'normal'}
                  onChange={e => handleThemeChange('waveSpeed', e.target.value)}
                  className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="slow">Slow (Relaxed)</option>
                  <option value="normal">Normal (Default)</option>
                  <option value="fast">Fast (Dynamic)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sakura Effects Settings - Firefly Style */}
          <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm mt-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Sakura Effects (Firefly Style)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Enable Sakura</label>
                <div className="flex items-center gap-3 mt-2">
                  <input 
                    type="checkbox" 
                    id="sakuraEnabled"
                    checked={formData.theme?.sakuraEnabled !== false}
                    onChange={e => handleThemeChange('sakuraEnabled', e.target.checked)}
                    className="w-4 h-4 text-accent bg-bg-base border-border rounded focus:ring-accent"
                  />
                  <label htmlFor="sakuraEnabled" className="text-sm font-medium text-text-primary cursor-pointer">
                    Enable falling cherry blossom petals
                  </label>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Beautiful sakura petals floating down (Firefly theme)
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Petal Density</label>
                <input 
                  type="number" 
                  min="10"
                  max="200"
                  value={formData.theme?.sakuraDensity || 50}
                  onChange={e => handleThemeChange('sakuraDensity', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-xs text-text-muted">
                  Number of petals (10-200)
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Fall Speed</label>
                <select 
                  value={formData.theme?.sakuraSpeed || 'normal'}
                  onChange={e => handleThemeChange('sakuraSpeed', e.target.value)}
                  className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="slow">Slow (Relaxed)</option>
                  <option value="normal">Normal (Default)</option>
                  <option value="fast">Fast (Dynamic)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Mascot Settings - Firefly Style */}
          <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm mt-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Mascot (Firefly Style)</h3>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="mascotEnabled"
                checked={formData.theme?.mascotEnabled !== false}
                onChange={e => handleThemeChange('mascotEnabled', e.target.checked)}
                className="w-4 h-4 text-accent bg-bg-base border-border rounded focus:ring-accent"
              />
              <label htmlFor="mascotEnabled" className="text-sm font-medium text-text-primary cursor-pointer">
                Enable Mascot Character
              </label>
            </div>
            <p className="text-xs text-text-muted mt-2 ml-7">
              Show an animated mascot character on the page (Firefly style with avatar, name, and messages)
            </p>
          </section>
        </section>

        {/* Music Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">Background Music</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-text-primary cursor-pointer" htmlFor="musicEnabled">Enable Music Player</label>
              <input 
                type="checkbox" 
                id="musicEnabled"
                checked={formData.music?.enabled || false}
                onChange={e => handleMusicChange('enabled', e.target.checked)}
                className="w-4 h-4 text-accent bg-bg-base border-border rounded focus:ring-accent"
              />
            </div>
          </div>
          
          {formData.music?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium text-text-primary">Audio URL (mp3/wav)</label>
                <input 
                  type="text" 
                  value={formData.music?.url || ''}
                  onChange={e => handleMusicChange('url', e.target.value)}
                  className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Song Title</label>
                <input 
                  type="text" 
                  value={formData.music?.title || ''}
                  onChange={e => handleMusicChange('title', e.target.value)}
                  className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Artist</label>
                <input 
                  type="text" 
                  value={formData.music?.artist || ''}
                  onChange={e => handleMusicChange('artist', e.target.value)}
                  className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-text-primary">Cover Image URL</label>
                <input 
                  type="text" 
                  value={formData.music?.cover || ''}
                  onChange={e => handleMusicChange('cover', e.target.value)}
                  className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex flex-col justify-center gap-2">
                <div className="flex items-center gap-3 mt-6">
                  <input 
                    type="checkbox" 
                    id="musicAutoplay"
                    checked={formData.music?.autoplay || false}
                    onChange={e => handleMusicChange('autoplay', e.target.checked)}
                    className="w-4 h-4 text-accent bg-bg-base border-border rounded focus:ring-accent"
                  />
                  <label htmlFor="musicAutoplay" className="text-sm font-medium text-text-primary cursor-pointer">
                    Autoplay (may be blocked by browser)
                  </label>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Social Links */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">Social Links</h2>
            <button 
              type="button"
              onClick={addSocial}
              className="text-sm text-accent hover:text-accent-hover font-medium"
            >
              + Add Link
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {(formData.social || []).map((social: any, index: number) => (
              <div key={index} className="flex items-center gap-4 bg-bg-base p-4 rounded-xl border border-border">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-text-secondary">Platform (github, twitter, mail, etc.)</label>
                    <input 
                      type="text" 
                      value={social.platform}
                      onChange={e => handleSocialChange(index, 'platform', e.target.value)}
                      className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-text-secondary">URL</label>
                    <input 
                      type="text" 
                      value={social.url}
                      onChange={e => handleSocialChange(index, 'url', e.target.value)}
                      className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => removeSocial(index)}
                  className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-6"
                >
                  Remove
                </button>
              </div>
            ))}
            {(!formData.social || formData.social.length === 0) && (
              <p className="text-sm text-text-secondary text-center py-4">No social links added yet.</p>
            )}
          </div>
        </section>

        {/* About Page Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">About Page</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">About Content (Markdown)</label>
              <textarea 
                value={formData.about?.content || ''}
                onChange={e => handleAboutChange('content', e.target.value)}
                rows={10}
                placeholder="# 关于我\n\n你好！我是...\n\n## 技术栈\n\n- React\n- TypeScript\n- ..."
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors resize-y font-mono text-sm"
              />
              <p className="text-xs text-text-muted">支持 Markdown 格式，将显示在 About 页面</p>
            </div>
            
            {/* Skills */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Skills</label>
                <button 
                  type="button"
                  onClick={addAboutSkill}
                  className="text-sm text-accent hover:text-accent-hover font-medium"
                >
                  + Add Skill
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {(formData.about?.skills || []).map((skill: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={skill}
                      onChange={e => handleAboutSkillsChange(index, e.target.value)}
                      placeholder="e.g., React / Vue / TypeScript"
                      className="flex-1 px-3 py-2 bg-bg-base border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={() => removeAboutSkill(index)}
                      className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {(!formData.about?.skills || formData.about.skills.length === 0) && (
                  <p className="text-sm text-text-secondary text-center py-2">No skills added yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-text-primary mb-6">Footer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">Copyright Text</label>
              <input 
                type="text" 
                value={formData.footer?.copyright || ''}
                onChange={e => handleFooterChange('copyright', e.target.value)}
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">ICP License</label>
              <input 
                type="text" 
                value={formData.footer?.icp || ''}
                onChange={e => handleFooterChange('icp', e.target.value)}
                placeholder="豫ICP备xxxxxxxx号-x"
                className="w-full px-4 py-2 bg-bg-base border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </section>

        {/* Navigation Settings */}
        <section className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">Navigation Menu</h2>
            <button 
              type="button"
              onClick={() => {
                setFormData((prev: any) => ({
                  ...prev,
                  nav: [...(prev.nav || []), { name: '', path: '', icon: 'Home', external: false, href: '' }]
                }));
              }}
              className="text-sm text-accent hover:text-accent-hover font-medium"
            >
              + Add Menu Item
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {(formData.nav || []).map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-4 bg-bg-base p-4 rounded-xl border border-border">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-text-secondary">Name</label>
                    <input 
                      type="text" 
                      value={item.name}
                      onChange={(e) => {
                        const newNav = [...(formData.nav || [])];
                        newNav[index] = { ...newNav[index], name: e.target.value };
                        setFormData((prev: any) => ({ ...prev, nav: newNav }));
                      }}
                      placeholder="Home"
                      className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-text-secondary">Path</label>
                    <input 
                      type="text" 
                      value={item.path}
                      onChange={(e) => {
                        const newNav = [...(formData.nav || [])];
                        newNav[index] = { ...newNav[index], path: e.target.value };
                        setFormData((prev: any) => ({ ...prev, nav: newNav }));
                      }}
                      placeholder="/"
                      className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-text-secondary">Icon</label>
                    <input 
                      type="text" 
                      value={item.icon}
                      onChange={(e) => {
                        const newNav = [...(formData.nav || [])];
                        newNav[index] = { ...newNav[index], icon: e.target.value };
                        setFormData((prev: any) => ({ ...prev, nav: newNav }));
                      }}
                      placeholder="Home"
                      className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-text-secondary">External URL (optional)</label>
                    <input 
                      type="text" 
                      value={item.href || ''}
                      onChange={(e) => {
                        const newNav = [...(formData.nav || [])];
                        newNav[index] = { ...newNav[index], external: !!e.target.value, href: e.target.value };
                        setFormData((prev: any) => ({ ...prev, nav: newNav }));
                      }}
                      placeholder="https://example.com"
                      className="w-full px-3 py-1.5 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const newNav = [...(formData.nav || [])];
                    newNav.splice(index, 1);
                    setFormData((prev: any) => ({ ...prev, nav: newNav }));
                  }}
                  className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-6"
                >
                  Remove
                </button>
              </div>
            ))}
            {(!formData.nav || formData.nav.length === 0) && (
              <p className="text-sm text-text-secondary text-center py-4">No navigation items added yet.</p>
            )}
          </div>
        </section>

      </form>
    </div>
  );
};
