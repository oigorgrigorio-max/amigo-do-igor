// Enviar foto para o ImgBB (Serviço Gratuito de Imagens)
let imageUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400';

if (imageFile) {
  const imgData = new FormData();
  imgData.append('image', imageFile);
  
  // Substitua SUA_CHAVE_IMGBB_AQUI pela chave obtida no site do ImgBB
  const res = await fetch('https://api.imgbb.com/1/upload?key=SUA_CHAVE_IMGBB_AQUI', {
    method: 'POST',
    body: imgData
  });
  
  const resData = await res.json();
  if (resData.success) {
    imageUrl = resData.data.url;
  }
}
nSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome do Pet *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Thor, Mel..."
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Situação</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  >
                    <option value="adoption">Para Adoção</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bairro em Neves *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Justinópolis, Sevilha"
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">WhatsApp de Contato *</label>
                <input 
                  type="text" 
                  required
                  placeholder="(31) 99999-9999"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                />
              </div>

              {/* Botão de Anexo de Foto do Celular */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Foto do Pet (Galeria)</label>
                <label className="flex items-center justify-center w-full p-3 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition text-emerald-700 font-medium">
                  <Camera className="h-5 w-5 mr-2" />
                  <span>{imageFile ? imageFile.name : "Escolher foto do celular"}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {previewUrl && (
                  <img src={previewUrl} alt="Pré-visualização" className="mt-2 h-32 w-full object-cover rounded-xl border" />
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Descrição</label>
                <textarea 
                  rows="3"
                  placeholder="Detalhes sobre a história, vacinas, temperamento..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>A guardar registo...</span>
                  </>
                ) : (
                  <span>Salvar Cadastro</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
 className="block font-medium text-slate-700 mb-1">Situação</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  >
                    <option value="adoption">Para Adoção</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Bairro em Neves *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Justinópolis, Sevilha"
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">WhatsApp de Contato *</label>
                <input 
                  type="text" 
                  required
                  placeholder="(31) 99999-9999"
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Link da Foto (URL)</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Descrição</label>
                <textarea 
                  rows="3"
                  placeholder="Detalhes sobre a história, vacinas, temperamento..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none"
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
