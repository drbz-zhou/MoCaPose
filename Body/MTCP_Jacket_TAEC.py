import json
import matplotlib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.io import savemat, loadmat
import tensorflow as tf
import time
from tensorflow.keras import layers
from sklearn.cluster import KMeans
from sklearn.metrics import confusion_matrix
from sklearn.mixture import GaussianMixture
import MTCP_Toolbox as tools
matplotlib.use('agg')
wdir = '/netscratch/bzhou/MTCP/'
subdir = 'TAEC2/'
print(subdir)
print(tf.__version__)

matstruct_contents = loadmat(wdir+'Outputs/UpperBody_XY.mat')
X_test = np.asarray(matstruct_contents['X_test'])
Y_test = np.asarray(matstruct_contents['Y_test'])
Y_predict = np.asarray(matstruct_contents['Y_predict'])
train_list = np.asarray(matstruct_contents['train_list'])
test_list = np.asarray(matstruct_contents['test_list'])
test_list_lens = np.asarray(matstruct_contents['test_list_lens'])
regressor_file = wdir+'Outputs/model_reg_best.h5'
win_pose = 32
PoseVidT_train, PoseCapT_train, PoseVidT_test, PoseCapT_test, test_list_lens = tools.read_data_taec(
    train_list, test_list, wdir, win_pose = win_pose, regressor_file=regressor_file)
print(PoseVidT_train.shape)
print(PoseCapT_train.shape)
print(PoseVidT_test.shape)
print(PoseCapT_test.shape)

print(['train_list: ',train_list])
print(['test_list: ',test_list])

# temporal autoencoder with 16x8x3 inputs

latent_dim = 16
def build_model_encoder(droprate=0.2):
    model = tf.keras.models.Sequential([
        layers.Conv2D(filters = 32, kernel_size = (4,8), padding='same', activation='gelu', input_shape=(win_pose,8,3)),
        layers.AveragePooling2D(pool_size=(2,1)), #3layers.Dropout(droprate),
        layers.BatchNormalization(),
        layers.Dropout(droprate),
        layers.Conv2D(filters = 32, kernel_size = (4,8), padding='same', activation='gelu'),
        layers.AveragePooling2D(pool_size=(2,1)), #3layers.Dropout(droprate),
        layers.BatchNormalization(),
        layers.Dropout(droprate),
        layers.Conv2D(filters = 32, kernel_size = 8,activation='gelu'),
        #layers.AveragePooling2D(pool_size=2), #3
        layers.Dropout(droprate),
        layers.BatchNormalization(),
        layers.Flatten(),
        #layers.Dense(16, activation='gelu'),
        layers.Dense(latent_dim)
    ])
    return model
def build_model_decoder(droprate=0.2):
    model = tf.keras.models.Sequential([
        layers.Dense(64),
        layers.Reshape((8,8,1), input_shape = (64,)),
        layers.Conv2DTranspose(filters = 32, kernel_size = 4, strides = (2,1),
                               padding = 'same', activation='relu'), #input_shape=(32,1)
        layers.Conv2DTranspose(filters = 32, kernel_size = 4, strides = (2,1),
                               padding = 'same', activation='relu'), #input_shape=(32,1)
        #layers.AveragePooling2D(pool_size=2), #3
        layers.Conv2D(filters = 32, kernel_size = 4, padding = 'same', activation='relu'),
        #layers.AveragePooling2D(pool_size=2), #3
        layers.Conv2D(filters = 3, kernel_size = 4, padding = 'same'),# activation='relu'),
    ])
    return model
m_model_enc = build_model_encoder()
m_model_dec = build_model_decoder()
m_input = layers.Input(shape=(32,8,3))
m_output = m_model_enc(m_input)
m_output = m_model_dec(m_output)

m_model_aec = tf.keras.models.Model(inputs = m_input, outputs = m_output)

m_opt = tf.keras.optimizers.Adam(0.00001)
m_model_aec.compile(optimizer=m_opt,
               loss='mse',
               metrics=["mae"])
m_model_enc.summary()
m_model_dec.summary()
m_model_aec.summary()

# custom training steps
total_epochs = 1000
train_part = int(np.round(0.7*len(PoseVidT_train)))
valid_part = int(np.round(0.3*len(PoseVidT_train)))
print(train_part,valid_part)
max_acc = 0.0
modelsavefile = wdir+'Outputs/'+subdir+'model_taec.h5'
patience = 200
patience_cnt = 0
num_clusters = 10
acc_all_km = np.zeros((total_epochs))
acc_all_gm = np.zeros((total_epochs))
val_mae_all = np.zeros((total_epochs))
cm_all_km = np.zeros((num_clusters,num_clusters,total_epochs))
cm_all_gm = np.zeros((num_clusters,num_clusters,total_epochs))
mae_all = np.zeros((total_epochs))
best_epoch = 0
last_epoch = 0
for e in range(total_epochs):
    print("epoch ", str(e))
    rng = np.random.default_rng()
    randind=rng.permutation(len(PoseVidT_train))

    history = m_model_aec.fit(np.concatenate([PoseVidT_train[randind[:train_part],:,:,:],PoseVidT_train[randind[:train_part],:,:,:]],0), 
                              np.concatenate([PoseVidT_train[randind[:train_part],:,:,:],PoseVidT_train[randind[:train_part],:,:,:]],0),
                              batch_size=2048, epochs=1, verbose=2,
                              validation_data=(PoseVidT_train[randind[:train_part],:,:,:], 
                                               PoseVidT_train[randind[:train_part],:,:,:]))
    
    mae_all[e]=np.array(history.history['mae'])
    val_mae_all[e]=np.array(history.history['val_mae'])
    #print(history.history["val_mae"])
    
    m_features = m_model_enc.predict(PoseVidT_train[randind[:train_part],:,:,:])
    
    for cls_mode in ['kmeans','gaussian']:
        print(cls_mode)
        if cls_mode == 'kmeans':
            m_clustering = KMeans(n_clusters=num_clusters, random_state=0, max_iter=1000, verbose = 0, n_init=30).fit(m_features)
            #### plot clusters
            plt.figure(figsize=(7, 4))
            for i in range(8):
                ax = plt.subplot(2,4,i+1)
                plt.scatter(m_features[:,i*2],m_features[:,i*2+1],marker='.',linewidths=0, alpha=0.01)
                plt.scatter(m_clustering.cluster_centers_[:,i*2],m_clustering.cluster_centers_[:,i*2+1], color = '#ff7f0e')

            plt.savefig(wdir+'Outputs/'+subdir+'TAEC_cluster_'+str(e)+'.png')
            plt.close()
            #### plot cluster center poses
            Y_centers = m_model_dec.predict(m_clustering.cluster_centers_)
            plt.figure(figsize=(7, 4))
            for i in range(num_clusters):
                for j in range(win_pose):
                    plt.subplot(2,5,i+1)
                    plt.xlim(0.1,0.9)
                    plt.ylim(-0.9,-0.1)
                    plt.plot(Y_centers[i,j,[0,1],0],-Y_centers[i,j,[0,1],1],alpha=0.02*j)
                    plt.plot(Y_centers[i,j,[1,2],0],-Y_centers[i,j,[1,2],1],alpha=0.02*j)
                    plt.plot(Y_centers[i,j,[2,3],0],-Y_centers[i,j,[2,3],1],alpha=0.02*j)
                    plt.plot(Y_centers[i,j,[3,4],0],-Y_centers[i,j,[3,4],1],alpha=0.02*j)
                    plt.plot(Y_centers[i,j,[1,5],0],-Y_centers[i,j,[1,5],1],alpha=0.02*j)
                    plt.plot(Y_centers[i,j,[5,6],0],-Y_centers[i,j,[5,6],1],alpha=0.02*j)
                    plt.plot(Y_centers[i,j,[6,7],0],-Y_centers[i,j,[6,7],1],alpha=0.02*j)
            plt.savefig(wdir+'Outputs/'+subdir+'TAEC_cluster_poses_'+str(e)+'.png')
            plt.close()    


        elif cls_mode == 'gaussian':
            m_clustering = GaussianMixture(n_components=num_clusters, random_state=0, verbose = 2).fit(m_features)
    
        F_test = m_model_enc.predict(PoseVidT_train[randind[train_part:],:,:,:])
        F_predict = m_model_enc.predict(PoseCapT_train[randind[train_part:],:,:,:])
        cls_test = m_clustering.predict(F_test)
        cls_predict = m_clustering.predict(F_predict)

        cm_test = confusion_matrix(cls_test, cls_predict).astype(float)
        orig_acc = np.sum(cm_test*np.eye(len(cm_test)), axis=None) / np.sum(cm_test, axis=None)
        
        plt.figure(figsize=(15,7))
        ax = plt.subplot(1,2,1)
        plt.imshow(cm_test)
        ax.title.set_text(cls_mode+" imbalanced acc %.4f" % orig_acc)

        for i in range(len(cm_test)):
            cm_test[:,i] = cm_test[:,i]/sum(cm_test[:,i])
        print(cm_test)
        norm_acc = np.sum(cm_test*np.eye(len(cm_test)), axis=None) / np.sum(cm_test, axis=None)
        
        ax = plt.subplot(1,2,2)
        plt.imshow(cm_test)
        ax.title.set_text(cls_mode+" normalized acc %.4f" % norm_acc)
        plt.savefig(wdir+'Outputs/'+subdir+'TAEC_'+cls_mode+'_cm_ep'+str(e)+'.png')
        plt.close()
        print("normalized accuracy: ", str(norm_acc))
        
        if cls_mode == 'kmeans':
            acc_all_km[e] = norm_acc
            cm_all_km[:,:,e]=cm_test
        elif cls_mode == 'gaussian':
            acc_all_gm[e] = norm_acc
            cm_all_gm[:,:,e]=cm_test
            
        if max_acc < norm_acc: #save best acc
            print("clustering acc improved from ",str(max_acc)," to ",str(norm_acc), " saving model.")
            max_acc = norm_acc
            best_epoch = e
            patience_cnt=0
            m_model_aec.save_weights(modelsavefile)
        else:
            patience_cnt = patience_cnt+1
            print(max_acc,norm_acc)
            print("clustering hasn't improved, best acc ",str(max_acc),", patience ", str(patience_cnt), " out of ", str(patience))
    if patience_cnt > patience:
        print("maximum patience reached, stopping training process")
        last_epoch = e
        break
            
plt.figure(figsize=(15,7))
ax = plt.subplot(1,2,1)
plt.plot(mae_all[:last_epoch])
plt.plot(val_mae_all[:last_epoch])
plt.title('MAE')
plt.ylabel('mae')
plt.xlabel('epoch')
plt.legend(['train', 'valid'], loc='upper left')

ax = plt.subplot(1,2,2)
plt.plot(acc_all_km[:last_epoch])
plt.plot(acc_all_gm[:last_epoch])
plt.title('clustering acc')
plt.ylabel('acc')
plt.xlabel('epoch')
plt.legend(['KMeans', 'GaussianM'], loc='upper left')
plt.savefig(wdir+'Outputs/'+subdir+'TAEC_mae_cm.png')
plt.close()

print("loading best model weights")
m_model_aec.load_weights(modelsavefile)
print("activation to construct feature space")
m_features = m_model_enc.predict(PoseVidT_train)
# k means clustering
for cls_mode in ['kmeans','gaussian']:
    print(cls_mode)
    if cls_mode == 'kmeans':
        m_clustering = KMeans(n_clusters=num_clusters, random_state=0, max_iter=1000, verbose = 0, n_init=30).fit(m_features)
        #### print clusters
        plt.figure(figsize=(7, 4))
        for i in range(8):
            ax = plt.subplot(2,4,i+1)
            plt.scatter(m_features[:,i*2],m_features[:,i*2+1],marker='.',linewidths=0, alpha=0.01)
            plt.scatter(m_clustering.cluster_centers_[:,i*2],m_clustering.cluster_centers_[:,i*2+1], color = '#ff7f0e')

        plt.savefig(wdir+'Outputs/'+subdir+'TAEC_cluster_final.png')
        plt.close()
    elif cls_mode == 'gaussian':
        m_clustering = GaussianMixture(n_components=num_clusters, random_state=0, verbose = 2).fit(m_features)

    F_test = m_model_enc.predict(PoseVidT_test)
    F_predict = m_model_enc.predict(PoseCapT_test) # how to get the Xc_predict
    cls_test = m_clustering.predict(F_test)
    cls_predict = m_clustering.predict(F_predict)

    cm_test = confusion_matrix(cls_test, cls_predict).astype(float)
    orig_acc = np.sum(cm_test*np.eye(len(cm_test)), axis=None) / np.sum(cm_test, axis=None)

    plt.figure(figsize=(15,7))
    ax = plt.subplot(1,2,1)
    plt.imshow(cm_test)
    ax.title.set_text(cls_mode+" imbalanced acc %.4f" % orig_acc)

    for i in range(len(cm_test)):
        cm_test[:,i] = cm_test[:,i]/sum(cm_test[:,i])
    print(cm_test)
    norm_acc = np.sum(cm_test*np.eye(len(cm_test)), axis=None) / np.sum(cm_test, axis=None)

    ax = plt.subplot(1,2,2)
    plt.imshow(cm_test)
    ax.title.set_text(cls_mode+" normalized acc %.4f" % norm_acc)
    plt.savefig(wdir+'Outputs/'+subdir+cls_mode+'_cm.png')
    plt.close()
    print("normalized accuracy: ", str(norm_acc))

savemat(wdir+'Outputs/'+subdir+'workspace.mat', {'mae_all': mae_all[:last_epoch], 'val_mae_all': val_mae_all[:last_epoch],
                                     'm_features': m_features,
                                     'cm_all_km':cm_all_km[:,:,:last_epoch], 'cm_all_gm':cm_all_gm[:,:,:last_epoch], 
                                     'acc_all_km':acc_all_km[:last_epoch],'acc_all_gm':acc_all_gm[:last_epoch],
                                     'best_epoch':best_epoch,
                                     'train_list':train_list, 'test_list':test_list,'test_list_lens':test_list_lens})

